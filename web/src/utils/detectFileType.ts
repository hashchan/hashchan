// Magic-byte MIME sniffing shared by every raw-bytes fetch path (Helia
// fs.cat, Kubo /api/v0/cat) — neither source gives us a Content-Type header.
export function detectFileType(bytes: Uint8Array): string {
  const signatures: Record<string, number[][]> = {
    // Images
    'image/jpeg': [[0xFF, 0xD8, 0xFF]],
    'image/png': [[0x89, 0x50, 0x4E, 0x47]],
    'image/gif': [[0x47, 0x49, 0x46, 0x38]],
    'image/webp': [[0x52, 0x49, 0x46, 0x46]],
    // Videos
    'video/mp4': [[0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70], [0x00, 0x00, 0x00, 0x1C, 0x66, 0x74, 0x79, 0x70]],
    'video/webm': [[0x1A, 0x45, 0xDF, 0xA3]],
    'video/x-matroska': [[0x1A, 0x45, 0xDF, 0xA3]], // MKV (same as WebM container)
    // Block SVG explicitly (XSS risk)
    'image/svg+xml': [[0x3C, 0x73, 0x76, 0x67], [0x3C, 0x3F, 0x78, 0x6D, 0x6C]], // <svg or <?xml
    // Block PDF explicitly (RCE risk)
    'application/pdf': [[0x25, 0x50, 0x44, 0x46, 0x2D]] // %PDF-
  }

  for (const [mimeType, sigs] of Object.entries(signatures)) {
    for (const sig of sigs) {
      if (sig.every((byte, i) => bytes[i] === byte)) {
        return mimeType
      }
    }
  }

  return 'application/octet-stream'
}
