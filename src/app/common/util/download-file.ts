
export function downloadFile(file: string, buffer: Blob | ArrayBuffer) {
  const url = window.URL.createObjectURL(buffer instanceof Blob ? buffer : new Blob([buffer]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', file);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}