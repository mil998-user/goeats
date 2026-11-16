// Mismas reglas que valida el backend (backend/src/utils/validation.ts).
// Aqui solo sirven para avisar antes de enviar; el servidor siempre vuelve a validar.

export function isValidEmail(email: string) {
  return email.length <= 191 && /^[^\s@"<>]+@[^\s@"<>]+\.[^\s@"<>]{2,}$/.test(email);
}

// Cedula ecuatoriana: provincia, tercer digito y digito verificador (modulo 10)
export function isValidCedula(cedula: string) {
  if (!/^\d{10}$/.test(cedula)) return false;
  const province = Number(cedula.slice(0, 2));
  if (!((province >= 1 && province <= 24) || province === 30) || Number(cedula[2]) >= 6) return false;
  const sum = [...cedula.slice(0, 9)].reduce((total, digit, index) => {
    const doubled = Number(digit) * (index % 2 === 0 ? 2 : 1);
    return total + (doubled > 9 ? doubled - 9 : doubled);
  }, 0);
  return (10 - (sum % 10)) % 10 === Number(cedula[9]);
}

// RUC: 13 digitos. El de una persona es su cedula mas el numero de establecimiento
export function isValidRuc(ruc: string) {
  if (!/^\d{13}$/.test(ruc)) return false;
  const third = Number(ruc[2]);
  if (third < 6) return isValidCedula(ruc.slice(0, 10)) && ruc.slice(10) !== "000";
  const province = Number(ruc.slice(0, 2));
  if (!((province >= 1 && province <= 24) || province === 30)) return false;
  if (third === 9) return ruc.slice(10) !== "000";
  if (third === 6) return ruc.slice(9) !== "0000";
  return false;
}

export function getNameError(name: string) {
  const value = name.trim();
  if (value.length < 3) return "Escribe tu nombre y apellido.";
  if (value.length > 150) return "El nombre no puede superar 150 caracteres.";
  return null;
}

export function getEmailError(email: string) {
  if (!email.trim()) return "Escribe tu correo electrónico.";
  return isValidEmail(email.trim()) ? null : "Revisa el correo, parece que tiene un error.";
}

export function getPhoneError(phone: string) {
  if (!phone.trim()) return "Escribe un número de teléfono.";
  return /^\+?\d[\d ()-]{6,19}$/.test(phone.trim()) ? null : "Revisa el número de teléfono.";
}

export function getUsernameError(username: string) {
  return /^[\w.@+-]{3,100}$/.test(username) ? null : "El usuario debe tener de 3 a 100 caracteres, sin espacios.";
}

export function getPasswordError(password: string) {
  if (password.length < 8) return "La contraseña debe tener al menos 8 caracteres.";
  if (new TextEncoder().encode(password).length > 72) return "La contraseña no puede superar 72 caracteres.";
  if (!/[a-zA-ZÀ-ÿ]/.test(password) || !/\d/.test(password)) return "La contraseña debe combinar letras y números.";
  return null;
}
