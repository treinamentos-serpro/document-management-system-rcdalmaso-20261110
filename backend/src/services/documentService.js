const fs = require('node:fs/promises');
const { randomUUID } = require('node:crypto');

function toPublicDocument(document) {
  return {
    id: document.id,
    originalName: document.originalName,
    size: document.size,
    uploadedAt: document.uploadedAt,
    owner: document.owner,
  };
}

function createDocumentService(repository) {
  return {
    async createDocument(file, owner) {
      const document = {
        id: randomUUID(),
        originalName: file.originalname,
        size: file.size,
        uploadedAt: new Date().toISOString(),
        owner,
        storageName: file.filename,
        mimeType: file.mimetype,
      };

      try {
        repository.create(document);
      } catch (error) {
        await repository.removeStoredFile(document.storageName);
        throw error;
      }

      return toPublicDocument(document);
    },

    listDocuments(owner) {
      return repository.findByOwner(owner).map(toPublicDocument);
    },

    async getDocumentForDownload(id, owner) {
      const document = repository.findOwnedById(id, owner);
      if (!document) return null;

      const filePath = repository.getFilePath(document.storageName);
      try {
        await fs.access(filePath, fs.constants.R_OK);
      } catch (error) {
        if (error.code === 'ENOENT' || error.code === 'EACCES') return null;
        throw error;
      }

      return { document: toPublicDocument(document), filePath };
    },
  };
}

module.exports = { createDocumentService };