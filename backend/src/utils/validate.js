const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// true only for text that looks like a UUID, e.g. 3f2a9c1e-5b7d-4e8a-9c3b-1a2b3c4d5e6f
export function isUuid(value) {
  return typeof value === 'string' && UUID_PATTERN.test(value);
}