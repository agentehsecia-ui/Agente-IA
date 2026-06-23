import { NextResponse } from 'next/server'

export async function GET() {
  const email = process.env.ALEGRA_EMAIL
  const token = process.env.ALEGRA_TOKEN

  if (!email || !token) {
    return NextResponse.json({
      error: 'Variables no encontradas',
      has_email: !!email,
      has_token: !!token,
    })
  }

  const auth = Buffer.from(`${email}:${token}`).toString('base64')

  try {
    const res = await fetch('https://api.alegra.com/api/v1/company', {
      headers: {
        'Authorization': `Basic ${auth}`,
      },
    })

    const status = res.status
    const body = await res.text()

    return NextResponse.json({
      email_preview: email.slice(0, 10) + '...',
      token_preview: token.slice(0, 6) + '...',
      auth_header_preview: `Basic ${auth.slice(0, 15)}...`,
      alegra_status: status,
      alegra_response: body.slice(0, 500),
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message })
  }
}
