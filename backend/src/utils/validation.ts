const MAX_AMOUNT = 100000;

// Returns the amount as a number, or null when it can't be accepted as money
export function parseAmount(value: unknown, options: { allowZero?: boolean } = {}): number | null {
  const isNumeric = typeof value === "number" || (typeof value === "string" && value.trim() !== "");
  const amount = isNumeric ? Number(value) : NaN;

  if (!Number.isFinite(amount) || amount < 0 || amount > MAX_AMOUNT) return null;
  if (amount === 0 && !options.allowZero) return null;
  return amount;
}

// Cards go through a simulator until the real Payphone integration exists
export function simulatedPaymentsAllowed() {
  return process.env.ALLOW_SIMULATED_PAYMENTS === "true";
}

const MAX_PASSWORD_BYTES = 72; // bcrypt ignores anything after this

export function getPasswordError(password: unknown) {
  if (typeof password !== "string" || password.length < 8) {
    return "La contraseña debe tener al menos 8 caracteres.";
  }
  if (Buffer.byteLength(password) > MAX_PASSWORD_BYTES) {
    return "La contraseña no puede superar 72 caracteres.";
  }
  if (!/[a-zA-ZÀ-ÿ]/.test(password) || !/\d/.test(password)) {
    return "La contraseña debe combinar letras y números.";
  }
  return null;
}

export function isValidEmail(email: unknown) {
  return typeof email === "string" && email.length <= 191 && /^[^\s@"<>]+@[^\s@"<>]+\.[^\s@"<>]{2,}$/.test(email);
}

// Ecuadorian ID: province, third digit and module 10 check digit
export function isValidCedula(cedula: unknown) {
  if (typeof cedula !== "string" || !/^\d{10}$/.test(cedula)) return false;

  const province = Number(cedula.slice(0, 2));
  if (!((province >= 1 && province <= 24) || province === 30) || Number(cedula[2]) >= 6) return false;

  const sum = [...cedula.slice(0, 9)].reduce((total, digit, index) => {
    const doubled = Number(digit) * (index % 2 === 0 ? 2 : 1);
    return total + (doubled > 9 ? doubled - 9 : doubled);
  }, 0);

  return (10 - (sum % 10)) % 10 === Number(cedula[9]);
}

// Ecuadorian RUC: 13 digits. A person's RUC is their ID plus the branch number.
// Companies (third digit 9) and public entities (6) are checked by structure only,
// because many RUCs issued by the SRI no longer pass the old module 11 check.
export function isValidRuc(ruc: unknown) {
  if (typeof ruc !== "string" || !/^\d{13}$/.test(ruc)) return false;
  const third = Number(ruc[2]);
  if (third < 6) return isValidCedula(ruc.slice(0, 10)) && ruc.slice(10) !== "000";

  const province = Number(ruc.slice(0, 2));
  if (!((province >= 1 && province <= 24) || province === 30)) return false;
  if (third === 9) return ruc.slice(10) !== "000";
  if (third === 6) return ruc.slice(9) !== "0000";
  return false;
}

// Keeps digits only, so "171234567-8" and 1712345678 are read the same way
export function normalizeIdentification(value: unknown) {
  if (typeof value !== "string" && typeof value !== "number") return "";
  return String(value).replace(/\D/g, "");
}

export function isValidIdentification(value: string, allowRuc = true) {
  return isValidCedula(value) || (allowRuc && isValidRuc(value));
}

// Every stored value that belongs to the same person: an ID and that person's RUC
export function getSameIdentityValues(value: string) {
  if (isValidCedula(value)) return [value, `${value}001`];
  if (value.length === 13 && Number(value[2]) < 6) {
    return [...new Set([value, value.slice(0, 10), `${value.slice(0, 10)}001`])];
  }
  return [value];
}

// Shared by every register form. Returns the error to show, or null
export function getAccountError({ username, password, name, email, phone }: Record<string, unknown>) {
  if (typeof username !== "string" || !/^[\w.@+-]{3,100}$/.test(username)) {
    return "El usuario debe tener de 3 a 100 caracteres, sin espacios.";
  }
  if (typeof name !== "string" || !name.trim() || name.length > 150) {
    return "El nombre es requerido y no puede superar 150 caracteres.";
  }
  if (email && !isValidEmail(email)) {
    return "El correo no es válido.";
  }
  if (phone && (typeof phone !== "string" || !/^\+?\d[\d ()-]{6,19}$/.test(phone))) {
    return "El teléfono no es válido.";
  }
  return getPasswordError(password);
}

export function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
