export interface ExifInfo { orientation: number | null; focalLength35mm: number | null; focalLengthMm: number | null }

/** Minimal, dependency-free EXIF reader (JPEG APP1). Returns nulls when anything is missing or malformed. */
export function parseExif(buffer: ArrayBuffer): ExifInfo {
  const none: ExifInfo = { orientation: null, focalLength35mm: null, focalLengthMm: null };
  try {
    const v = new DataView(buffer);
    if (v.byteLength < 4 || v.getUint16(0) !== 0xffd8) return none;
    let p = 2;
    while (p + 4 < v.byteLength) {
      if (v.getUint8(p) !== 0xff) return none;
      const marker = v.getUint8(p + 1); const len = v.getUint16(p + 2);
      if (marker === 0xe1 && v.getUint32(p + 4) === 0x45786966 /* "Exif" */) return readTiff(v, p + 10);
      if (marker === 0xda) return none;
      p += 2 + len;
    }
  } catch { /* malformed EXIF is not an error for analysis */ }
  return none;
}

function readTiff(v: DataView, base: number): ExifInfo {
  const out: ExifInfo = { orientation: null, focalLength35mm: null, focalLengthMm: null };
  const le = v.getUint16(base) === 0x4949;
  const u16 = (o: number) => v.getUint16(o, le); const u32 = (o: number) => v.getUint32(o, le);
  const walk = (ifd: number, visit: (tag: number, type: number, valueOffset: number) => void) => {
    const n = u16(base + ifd);
    for (let i = 0; i < n; i++) { const e = base + ifd + 2 + i * 12; visit(u16(e), u16(e + 2), e + 8); }
  };
  let exifIfd = 0;
  walk(u32(base + 4), (tag, _type, vo) => { if (tag === 0x0112) out.orientation = u16(vo); if (tag === 0x8769) exifIfd = u32(vo); });
  if (exifIfd) walk(exifIfd, (tag, type, vo) => {
    if (tag === 0xa405) out.focalLength35mm = u16(vo) || null;
    if (tag === 0x920a && type === 5) { const o = u32(vo); const den = u32(base + o + 4); out.focalLengthMm = den ? u32(base + o) / den : null; }
  });
  return out;
}
