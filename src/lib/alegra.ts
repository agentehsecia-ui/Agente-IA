const ALEGRA_API = 'https://api.alegra.com/api/v1'

function getAuthHeader(): string {
  const email = process.env.ALEGRA_EMAIL
  const token = process.env.ALEGRA_TOKEN
  if (!email || !token) throw new Error('Credenciales de Alegra no configuradas')
  return 'Basic ' + Buffer.from(`${email}:${token}`).toString('base64')
}

async function alegraFetch(endpoint: string, options: RequestInit = {}) {
  const res = await fetch(`${ALEGRA_API}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': getAuthHeader(),
      ...options.headers,
    },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Alegra API ${res.status}: ${text}`)
  }
  return res.json()
}

export async function getFacturasCompra(limit = 50, start = 0) {
  return alegraFetch(`/bills?limit=${limit}&start=${start}&order_direction=DESC&order_field=date`)
}

export async function getFacturaCompra(id: string) {
  return alegraFetch(`/bills/${id}`)
}

export async function getContacto(id: string) {
  return alegraFetch(`/contacts/${id}`)
}

export async function getContactos(limit = 100) {
  return alegraFetch(`/contacts?limit=${limit}&type=provider`)
}

export async function aplicarPagoAlegra(billId: string, amount: number, date: string, bankAccountId?: string) {
  return alegraFetch('/payments', {
    method: 'POST',
    body: JSON.stringify({
      date,
      amount,
      type: 'out',
      bills: [{ id: Number(billId), amount }],
      ...(bankAccountId && { bankAccount: { id: Number(bankAccountId) } }),
    }),
  })
}

export async function getCuentasBancarias() {
  return alegraFetch('/bank-accounts')
}
