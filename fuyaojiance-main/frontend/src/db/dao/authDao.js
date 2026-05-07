const DEFAULT_USERNAME = 'admin'
const DEFAULT_PASSWORD = 'admin123'

export function login(username, password) {
  if (username === DEFAULT_USERNAME && password === DEFAULT_PASSWORD) {
    const token = btoa(`${username}:${Date.now()}`)
    localStorage.setItem('token', token)
    localStorage.setItem('username', username)
    return { success: true, token, username }
  }
  return { success: false, message: '用户名或密码错误' }
}

export function logout() {
  localStorage.removeItem('token')
  localStorage.removeItem('username')
}

export function getCurrentUser() {
  const token = localStorage.getItem('token')
  const username = localStorage.getItem('username')
  
  if (token && username) {
    return { token, username }
  }
  return null
}

export function isLoggedIn() {
  return !!localStorage.getItem('token')
}
