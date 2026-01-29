"use server"
const API_URL = process.env.NEXT_PUBLIC_API_URL 

export async function sendPasswordResetCode(email: string) {
  try {
    const response = await fetch(`${API_URL}/password/send-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ email }),
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: data.message || 'Error al enviar el código',
      }
    }

    return {
      success: true,
      message: data.message,
    }
  } catch (error) {
    return {
      success: false,
      error: 'Error de conexión con el servidor',
    }
  }
}

export async function verifyPasswordResetCode(email: string, code: string) {
  try {
    const response = await fetch(`${API_URL}/password/verify-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ email, code }),
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: data.message || 'Código inválido o expirado',
      }
    }

    return {
      success: true,
      message: data.message,
    }
  } catch (error) {
    return {
      success: false,
      error: 'Error de conexión con el servidor',
    }
  }
}

export async function resetPassword(
  email: string,
  code: string,
  password: string,
  password_confirmation: string
) {
  try {
    const response = await fetch(`${API_URL}/password/reset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ email, code, password, password_confirmation }),
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: data.message || 'Error al cambiar la contraseña',
      }
    }

    return {
      success: true,
      message: data.message,
    }
  } catch (error) {
    return {
      success: false,
      error: 'Error de conexión con el servidor',
    }
  }
}
