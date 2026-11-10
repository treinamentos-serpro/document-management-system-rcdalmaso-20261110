function createDocumentController(service) {
  function requireOwner(req, res, next) {
    const owner = req.get('X-User-Id')?.trim();
    if (!owner) {
      return res.status(401).json({
        error: { code: 'USER_REQUIRED', message: 'Identifique o usuário da requisição.' },
      });
    }

    req.owner = owner;
    return next();
  }

  return {
    requireOwner,

    async upload(req, res) {
      if (!req.file) {
        return res.status(400).json({
          error: { code: 'FILE_REQUIRED', message: 'Envie um arquivo no campo "file".' },
        });
      }

      const document = await service.createDocument(req.file, req.owner);
      return res.status(201).json(document);
    },

    list(req, res) {
      return res.json({ documents: service.listDocuments(req.owner) });
    },

    async download(req, res) {
      const result = await service.getDocumentForDownload(req.params.id, req.owner);
      if (!result) {
        return res.status(404).json({
          error: { code: 'DOCUMENT_NOT_FOUND', message: 'Documento não encontrado.' },
        });
      }

      const downloadName = result.document.originalName
        .replace(/\\/g, '/')
        .split('/')
        .pop()
        .replace(/[\r\n"]/g, '_') || 'document';

      return res.download(result.filePath, downloadName, (error) => {
        if (error && !res.headersSent) {
          res.status(404).json({
            error: { code: 'DOCUMENT_NOT_FOUND', message: 'Documento não encontrado.' },
          });
        }
      });
    },
  };
}

module.exports = { createDocumentController };