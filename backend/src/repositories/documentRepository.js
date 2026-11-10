const fs = require('node:fs/promises');
const path = require('node:path');

class DocumentRepository {
  constructor(storageDirectory) {
    this.storageDirectory = storageDirectory;
    this.documents = new Map();
  }

  create(document) {
    this.documents.set(document.id, document);
    return { ...document };
  }

  findByOwner(owner) {
    return [...this.documents.values()]
      .filter((document) => document.owner === owner)
      .map((document) => ({ ...document }));
  }

  findOwnedById(id, owner) {
    const document = this.documents.get(id);
    return document?.owner === owner ? { ...document } : null;
  }

  getFilePath(storageName) {
    return path.join(this.storageDirectory, storageName);
  }

  async removeStoredFile(storageName) {
    try {
      await fs.unlink(this.getFilePath(storageName));
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
}

module.exports = { DocumentRepository };