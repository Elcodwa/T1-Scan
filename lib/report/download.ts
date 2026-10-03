/** Hands the generated PDF to the browser as a download. The bytes never leave the device. */
export function downloadPdf(bytes: Uint8Array, filename: string): void {
  const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: "application/pdf" }));
  const a = document.createElement("a"); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
export const reportFilename = (d = new Date()) => `t1-scan-report-${d.toISOString().slice(0, 10)}.pdf`;
