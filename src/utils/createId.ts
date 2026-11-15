type CryptoLike = { getRandomValues?: (array: Uint8Array) => Uint8Array };

function randomBytes(count: number): Uint8Array {
  const bytes = new Uint8Array(count);
  const cryptoApi = (globalThis as { crypto?: CryptoLike }).crypto;
  if (cryptoApi?.getRandomValues) {
    return cryptoApi.getRandomValues(bytes);
  }
  // Ids are not secrets (every record is scoped to its owner on the server),
  // so Math.random is an acceptable fallback where Web Crypto is missing.
  for (let i = 0; i < count; i += 1) {
    bytes[i] = Math.floor(Math.random() * 256);
  }
  return bytes;
}

/** RFC 4122 version 4 UUID. Records keep this id on the server when synced. */
export function createId(): string {
  const bytes = randomBytes(16);
  // Version 4 (0100xxxx) and RFC 4122 variant (10xxxxxx) bits.
  bytes[6] = 0x40 + (bytes[6] % 16);
  bytes[8] = 0x80 + (bytes[8] % 64);
  const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0'));
  return [
    hex.slice(0, 4).join(''),
    hex.slice(4, 6).join(''),
    hex.slice(6, 8).join(''),
    hex.slice(8, 10).join(''),
    hex.slice(10, 16).join(''),
  ].join('-');
}

const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_V4.test(value);
}
