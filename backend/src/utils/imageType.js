// Looks at the first bytes of a file to find its REAL type.
// Returns 'image/jpeg', 'image/png', 'image/webp', or null if it is none of these.
export function detectImageType(buffer) {
  if (!buffer || buffer.length < 12) return null;

  // JPEG files start with FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }

  // PNG files start with 89 50 4E 47 0D 0A 1A 0A
  const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (pngSignature.every((byte, i) => buffer[i] === byte)) {
    return 'image/png';
  }

  // WebP files contain "RIFF" at the start and "WEBP" at position 8
  if (
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'image/webp';
  }

  return null;
}