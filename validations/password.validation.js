function isStrongPassword(password) {
  const hasUpperCase = /[A-Z]/.test(password); 
  const hasLowerCase = /[a-z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasForbiddenSymbols = /[.,\/|[\]{}()^%#]/.test(password);
  return hasUpperCase && hasLowerCase && hasDigit && !hasForbiddenSymbols;
}

const validTlds = new Set([
  "com", "net", "org", "edu", "gov", "mil", "int", "biz", "info", "name", "pro", "aero", "coop", "museum",
  "uz", "ru", "us", "uk", "de", "fr", "it", "jp", "cn", "kr", "in", "ca", "au", "ch", "es", "nl", "se", "no",
  "tv", "me", "io", "ai", "dev", "app", "xyz", "site", "online", "store", "tech", "blog", "club"
]);

function validateEmail(email) {
  const errors = [];

  if (!email.includes('@')) {
    errors.push("Email должен содержать символ '@'.");
    return { isValid: false, errors };
  }

  const [localPart, domainPart] = email.split('@');

  if (!localPart || !domainPart) {
    errors.push("Email должен содержать и имя пользователя, и домен.");
    return { isValid: false, errors };
  }

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    errors.push("Неверный формат email.");
  }

  if (localPart.startsWith('.') || localPart.endsWith('.')) {
    errors.push("Имя пользователя не может начинаться или заканчиваться точкой.");
  }

  if (email.includes('..')) {
    errors.push("Email не должен содержать две точки подряд.");
  }

  if (email.length > 254) {
    errors.push("Email слишком длинный (максимум 254 символа).");
  }

  if (localPart.length > 64) {
    errors.push("Имя пользователя слишком длинное (максимум 64 символа).");
  }

  const domainParts = domainPart.split('.');
  const tld = domainParts[domainParts.length - 1]?.toLowerCase();
  if (!validTlds.has(tld)) {
    errors.push(`Недопустимая доменная зона: .${tld}`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

module.exports = {validateEmail,isStrongPassword};

