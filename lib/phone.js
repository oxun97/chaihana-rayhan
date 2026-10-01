// Russian numbers arrive as "+7 900 123-45-67", "89001234567", "9001234567"…
// Accounts are stored as 11 digits starting with 7, so the same person can
// neither register twice nor be told "wrong password" for typing the
// number differently than at sign-up.
export function normalizePhone(raw) {
  let digits = String(raw || "").replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("8")) digits = `7${digits.slice(1)}`;
  if (digits.length === 10) digits = `7${digits}`;
  return digits.length === 11 && digits.startsWith("7") ? digits : null;
}

// Every spelling an account created before normalisation may be stored
// under, for lookups by phone.
export function phoneVariants(raw) {
  const n = normalizePhone(raw);
  const trimmed = String(raw || "").trim();
  if (!n) return trimmed ? [trimmed] : [];
  const ten = n.slice(1);
  return [...new Set([n, ten, `8${ten}`, `+7${ten}`, trimmed])];
}
