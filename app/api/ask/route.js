export const dynamic = 'force-dynamic'

export async function POST(request) {
  const body = await request.json()
  const { messages, mode } = body

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return Response.json({ error: 'messages required' }, { status: 400 })
  }

  const backendUrl = process.env.CP_BACKEND_URL
  const cpSecret = process.env.CP_SECRET

  if (!backendUrl || !cpSecret) {
    return Response.json({ error: 'Backend not configured' }, { status: 503 })
  }

  try {
    const res = await fetch(`${backendUrl}/api/alfred/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // CP's requireToken gate matches CP_SECRET against the X-CP-Token header
        // (backend/src/index.js). It does NOT read x-cp-secret.
        'X-CP-Token': cpSecret,
      },
      body: JSON.stringify({
        messages,
        mode: mode || 'typed',
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      return Response.json({ error: data.error || 'Backend error' }, { status: res.status })
    }

    return Response.json({ text: data.text, degraded: data.degraded || false })
  } catch (err) {
    return Response.json({ error: 'Could not reach backend' }, { status: 502 })
  }
}
