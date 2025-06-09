function isStrongPassword(password) {
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasDigit = /\d/.test(password);
  return hasUpperCase && hasLowerCase && hasDigit;
}

module.exports = isStrongPassword
