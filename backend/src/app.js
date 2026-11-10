const express = require('express');
const multer = require('multer');
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { DocumentRepository } = require('./repositories/documentRepository');
const { createDocumentService } = require('./services/documentService');
const { createDocumentController } = require('./controllers/documentController');
const { createDocumentRoutes } = require('./routes/documentRoutes');

const DEFAULT_MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;

function createApp(options = {}) {
  const storageDirectory = options.storageDirectory
    || process.env.STORAGE_DIR
    || path.resolve(__dirname, '../storage');
  const maxUploadSizeBytes = options.maxUploadSizeBytes
    || Number(process.env.MAX_FILE_SIZE_BYTES)
    || DEFAULT_MAX_UPLOAD_SIZE_BYTES;

  fs.mkdirSync(storageDirectory, { recursive: true });

  const repository = options.repository || new DocumentRepository(storageDirectory);
  const service = createDocumentService(repository);
  const controller = createDocumentController(service);
  const upload = multer({
    storage: multer.diskStorage({
      destination: storageDirectory,
      filename: (req, file, callback) => callback(null, randomUUID()),
    }),
    limits: { fileSize: maxUploadSizeBytes },
  });

  const app = express();
  app.use(express.json());
  app.get('/health', (req, res) => res.json({ status: 'ok' }));
  app.use('/', createDocumentRoutes(controller, upload));
  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);

    if (error instanceof multer.MulterError) {
      const tooLarge = error.code === 'LIMIT_FILE_SIZE';
      return res.status(tooLarge ? 413 : 400).json({
        error: {
          code: tooLarge ? 'FILE_TOO_LARGE' : 'INVALID_UPLOAD',
          message: tooLarge
            ? 'O arquivo excede o limite permitido.'
            : 'Não foi possível processar o arquivo enviado.',
        },
      });
    }

    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Ocorreu um erro interno.' },
    });
  });

  return app;
}

if (require.main === module) {
  const app = createApp();
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`DMS backend ouvindo na porta ${PORT}`);
  });
}

const app = createApp();
app.createApp = createApp;

module.exports = app;
