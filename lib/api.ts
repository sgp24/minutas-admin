const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.minutas.com.mx'

function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('admin_token')
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken()
  const res = await fetch(`${API_URL}/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  })

  if (res.status === 401) {
    // Token expirado o inválido — limpiar sesión y redirigir a login
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_user')
      // Importar js-cookie dinámicamente para no acoplar el módulo
      const Cookies = (await import('js-cookie')).default
      Cookies.remove('admin_token')
      window.location.href = '/login'
    }
    throw new Error('Sesión expirada. Redirigiendo...')
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }))
    throw new Error(error.message ?? 'Error en la solicitud')
  }
  return res.json()
}

export const api = {
  get:    <T>(path: string)                        => request<T>(path),
  post:   <T>(path: string, body: unknown)         => request<T>(path, { method: 'POST',  body: JSON.stringify(body) }),
  patch:  <T>(path: string, body: unknown)         => request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string)                        => request<T>(path, { method: 'DELETE' }),
}
