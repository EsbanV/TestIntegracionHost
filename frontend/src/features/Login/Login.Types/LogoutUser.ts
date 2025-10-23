/**
 * Caso de uso para cerrar sesión del usuario
 * Limpia el token de autenticación y cualquier estado persistente
 */
export class LogoutUser {
  execute(): void {
    try {
      // Limpiar token de Google OAuth
      localStorage.removeItem('google_credential')
      
      // Limpiar cualquier otro dato de sesión que pueda existir
      localStorage.removeItem('user_data')
      sessionStorage.clear()
      
      // Opcional: limpiar cookies si se usan
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/")
      })
    } catch (error) {
      console.error('Error durante el logout:', error)
      throw new Error('No se pudo cerrar la sesión correctamente')
    }
  }
}
