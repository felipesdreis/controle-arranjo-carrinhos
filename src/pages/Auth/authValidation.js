// Helpers puros de validação para os formulários de autenticação.
// Retornam string de erro quando inválido, ou null quando válido.

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Verifica se o email tem formato válido.
 * @param {string} email
 * @returns {string|null} mensagem de erro ou null
 */
export function validateEmail(email) {
  if (!email || !email.trim()) return 'O email é obrigatório.'
  if (!EMAIL_REGEX.test(email.trim())) return 'Email inválido.'
  return null
}

/**
 * Verifica se a senha atende ao comprimento mínimo.
 * @param {string} password
 * @returns {string|null} mensagem de erro ou null
 */
export function validatePassword(password) {
  if (!password) return 'A senha é obrigatória.'
  if (password.length < 8) return 'A senha deve ter pelo menos 8 caracteres.'
  return null
}

/**
 * Verifica se as duas senhas são idênticas.
 * @param {string} password
 * @param {string} confirmation
 * @returns {string|null} mensagem de erro ou null
 */
export function validatePasswordMatch(password, confirmation) {
  if (password !== confirmation) return 'As senhas não correspondem.'
  return null
}
