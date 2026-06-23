import { createServerClient } from '@/lib/supabase'
import { getFacturasCompra } from '@/lib/alegra'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const supabase = createServerClient()

  // Obtener el primer usuario con rol sostenibilidad o admin como creador por defecto
  const { data: defaultUser } = await supabase
    .from('perfiles')
    .select('id')
    .in('rol', ['sostenibilidad', 'admin'])
    .limit(1)
    .single()

  const creadorId = defaultUser?.id || null
  if (!creadorId) {
    return NextResponse.json({ error: 'No hay usuario de sostenibilidad para asignar las solicitudes' }, { status: 400 })
  }

  let bills
  try {
    bills = await getFacturasCompra(30)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }

  if (!Array.isArray(bills)) {
    return NextResponse.json({ error: 'Respuesta inesperada de Alegra', data: bills }, { status: 500 })
  }

  // Solo traer las que tienen saldo pendiente (balance > 0)
  const pendientes = bills.filter((b: any) => {
    const balance = parseFloat(b.balance || '0')
    return balance > 0
  })

  let importados = 0
  let existentes = 0
  let errores = 0

  for (const bill of pendientes) {
    // Verificar si ya existe en SIGACP (por referencia alegra_id)
    const { data: existing } = await supabase
      .from('solicitudes')
      .select('id')
      .eq('alegra_id', String(bill.id))
      .maybeSingle()

    if (existing) { existentes++; continue }

    // Buscar o crear proveedor
    const providerName = bill.provider?.name || bill.client?.name || 'Sin nombre'
    const providerNit = bill.provider?.identification || bill.client?.identification || `ALEGRA-${bill.id}`

    let proveedorId: string | null = null

    const { data: provExist } = await supabase
      .from('proveedores')
      .select('id')
      .eq('nit', providerNit)
      .maybeSingle()

    if (provExist) {
      proveedorId = provExist.id
    } else {
      const { data: newProv, error: provErr } = await supabase
        .from('proveedores')
        .insert({
          nit: providerNit,
          razon_social: providerName,
          email: bill.provider?.email || null,
          telefono: bill.provider?.phonePrimary || null,
        })
        .select('id')
        .single()

      if (provErr) { errores++; continue }
      proveedorId = newProv.id
    }

    // Determinar tipo de pago
    let tipoPago = 'proveedor'
    const concepto = (bill.observations || bill.numberTemplate?.fullNumber || `Factura Alegra #${bill.id}`).toLowerCase()
    if (concepto.includes('hotel')) tipoPago = 'hotel'
    else if (concepto.includes('transporte') || concepto.includes('viaje')) tipoPago = 'transporte'
    else if (concepto.includes('honorario')) tipoPago = 'honorarios'

    // Crear solicitud
    const balance = parseFloat(bill.balance || bill.total || '0')
    const fechaLimite = bill.dueDate || bill.date || new Date().toISOString().slice(0, 10)

    const { error: solErr } = await supabase
      .from('solicitudes')
      .insert({
        proveedor_id: proveedorId,
        tipo_pago: tipoPago,
        concepto: bill.observations || bill.numberTemplate?.fullNumber || `Factura de compra #${bill.id}`,
        valor: balance,
        fecha_limite: fechaLimite,
        estado: 'borrador',
        alegra_id: String(bill.id),
        alegra_number: bill.numberTemplate?.fullNumber || null,
        creado_por: creadorId,
      })

    if (solErr) {
      console.error('Error creando solicitud:', solErr.message)
      errores++
    } else {
      importados++
    }
  }

  return NextResponse.json({
    total_alegra: bills.length,
    pendientes: pendientes.length,
    importados,
    existentes,
    errores,
  })
}
