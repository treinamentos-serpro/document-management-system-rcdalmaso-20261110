async function readError(response) {
  const body = await response.json().catch(() => null);
  return body?.error?.message || 'Não foi possível concluir a operação.';
}

function userHeaders(userId) {
  return { 'X-User-Id': userId };
}

export async function listDocuments(userId) {
  const response = await fetch('/api/documents', {
    headers: userHeaders(userId),
  });
  if (!response.ok) throw new Error(await readError(response));
  const result = await response.json();
  return result.documents;
}

export async function uploadDocument(file, userId) {
  const body = new FormData();
  body.append('file', file);

  const response = await fetch('/api/upload', {
    method: 'POST',
    headers: userHeaders(userId),
    body,
  });
  if (!response.ok) throw new Error(await readError(response));
  return response.json();
}

export async function downloadDocument(document, userId) {
  const response = await fetch(`/api/documents/${encodeURIComponent(document.id)}/download`, {
    headers: userHeaders(userId),
  });
  if (!response.ok) throw new Error(await readError(response));

  const objectUrl = URL.createObjectURL(await response.blob());
  const link = window.document.createElement('a');
  link.href = objectUrl;
  link.download = document.originalName;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}