export function generateInviteCode() {
  return Array.from(
    crypto.getRandomValues(new Uint8Array(12)),
    (byte) => "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"[byte & 31],
  ).join("");
}

export function normalizeInviteCode(input: string) {
  return input.toUpperCase().replace(/[^0-9A-Z]/g, "");
}

export function formatInviteCode(code: string) {
  return code.match(/.{1,4}/g)?.join("-") ?? code;
}
