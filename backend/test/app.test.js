const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { once } = require('node:events');
const appModule = require('../src/app');

async function startTestServer(t, options = {}) {
  const storageDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'dms-test-'));
  const app = appModule.createApp({ storageDirectory, ...options });
  const server = app.listen(0);
  await once(server, 'listening');
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  t.after(async () => {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
    await fs.rm(storageDirectory, { recursive: true, force: true });
  });

  return { baseUrl, storageDirectory };
}

function createUploadForm(contents, filename = 'relatorio.txt') {
  const form = new FormData();
  form.append('file', new Blob([contents], { type: 'text/plain' }), filename);
  return form;
}

test('o app backend é exportado', () => {
  assert.equal(typeof appModule, 'function');
  assert.equal(typeof appModule.createApp, 'function');
});

test('faz upload, lista apenas documentos do proprietário e permite download', async (t) => {
  const { baseUrl, storageDirectory } = await startTestServer(t);
  const uploadResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': 'ana' },
    body: createUploadForm('conteudo'),
  });

  assert.equal(uploadResponse.status, 201);
  const document = await uploadResponse.json();
  assert.equal(document.originalName, 'relatorio.txt');
  assert.equal(document.size, 8);
  assert.equal(document.owner, 'ana');
  assert.ok(document.id);
  assert.ok(document.uploadedAt);
  assert.equal(Object.hasOwn(document, 'storageName'), false);

  const storedFiles = await fs.readdir(storageDirectory);
  assert.equal(storedFiles.length, 1);
  assert.notEqual(storedFiles[0], document.originalName);

  const ownerList = await fetch(`${baseUrl}/documents`, {
    headers: { 'X-User-Id': 'ana' },
  });
  assert.deepEqual((await ownerList.json()).documents, [document]);

  const otherUserList = await fetch(`${baseUrl}/documents`, {
    headers: { 'X-User-Id': 'bia' },
  });
  assert.deepEqual((await otherUserList.json()).documents, []);

  const forbiddenDownload = await fetch(`${baseUrl}/documents/${document.id}/download`, {
    headers: { 'X-User-Id': 'bia' },
  });
  assert.equal(forbiddenDownload.status, 404);

  const download = await fetch(`${baseUrl}/documents/${document.id}/download`, {
    headers: { 'X-User-Id': 'ana' },
  });
  assert.equal(download.status, 200);
  assert.equal(await download.text(), 'conteudo');
  assert.match(download.headers.get('content-disposition'), /relatorio\.txt/);
});

test('valida usuário e arquivo e limita o tamanho do upload', async (t) => {
  const { baseUrl, storageDirectory } = await startTestServer(t, {
    maxUploadSizeBytes: 4,
  });

  const unauthenticated = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: createUploadForm('ok'),
  });
  assert.equal(unauthenticated.status, 401);
  assert.deepEqual(await fs.readdir(storageDirectory), []);

  const missingFile = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': 'ana' },
  });
  assert.equal(missingFile.status, 400);

  const oversized = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': 'ana' },
    body: createUploadForm('grande'),
  });
  assert.equal(oversized.status, 413);
  assert.equal((await oversized.json()).error.code, 'FILE_TOO_LARGE');
});
