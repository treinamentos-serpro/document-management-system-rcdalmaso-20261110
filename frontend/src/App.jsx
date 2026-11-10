import { useEffect, useState } from 'react';
import { DocumentList } from './components/DocumentList.jsx';
import { UploadPanel } from './components/UploadPanel.jsx';
import {
  downloadDocument,
  listDocuments,
  uploadDocument,
} from './services/documents.js';
import './app.css';

export default function App() {
  const [userId, setUserId] = useState(
    () => localStorage.getItem('dms-user-id') || 'usuario-demo',
  );
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    localStorage.setItem('dms-user-id', userId);
  }, [userId]);

  useEffect(() => {
    let active = true;
    const owner = userId.trim();

    if (!owner) {
      setDocuments([]);
      setLoading(false);
      return () => {
        active = false;
      };
    }

    setDocuments([]);
    setLoading(true);
    setError('');
    listDocuments(owner)
      .then((result) => {
        if (active) setDocuments(result);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [userId, refreshKey]);

  async function handleUpload(file) {
    setUploading(true);
    setError('');
    setNotice('');
    try {
      await uploadDocument(file, userId.trim());
      setNotice('Documento enviado.');
      setRefreshKey((key) => key + 1);
      return true;
    } catch (requestError) {
      setError(requestError.message);
      return false;
    } finally {
      setUploading(false);
    }
  }

  async function handleDownload(document) {
    setDownloadingId(document.id);
    setError('');
    try {
      await downloadDocument(document, userId.trim());
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <main className="workspace">
      <header className="topbar">
        <a className="wordmark" href="#inicio" aria-label="Arquivo, início">
          <span className="wordmark-mark" aria-hidden="true">A</span>
          <span>ARQUIVO<span className="wordmark-period">.</span></span>
        </a>
        <label className="identity-field">
          <span>USUÁRIO ATIVO</span>
          <input
            aria-label="Identificador do usuário"
            value={userId}
            onChange={(event) => setUserId(event.target.value)}
            maxLength={100}
          />
        </label>
      </header>

      <section className="page-heading" id="inicio">
        <div>
          <p className="eyebrow">ESPAÇO PESSOAL</p>
          <h1>Seus documentos<span>.</span></h1>
          <p className="heading-copy">Arquivos importantes, organizados em um só lugar.</p>
        </div>
        <div className="document-count" aria-live="polite">
          <strong>{documents.length.toString().padStart(2, '0')}</strong>
          <span>{documents.length === 1 ? 'DOCUMENTO' : 'DOCUMENTOS'}</span>
        </div>
      </section>

      <div className="content-grid">
        <section className="library-section" aria-labelledby="library-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">BIBLIOTECA</p>
              <h2 id="library-title">Arquivos enviados</h2>
            </div>
            <span className="section-index">01 / ARQUIVOS</span>
          </div>

          {error && <p className="message message-error" role="alert">{error}</p>}
          {notice && <p className="message message-success" role="status">{notice}</p>}
          <DocumentList
            documents={documents}
            loading={loading}
            onDownload={handleDownload}
            downloadingId={downloadingId}
          />
        </section>

        <aside className="upload-section" aria-labelledby="upload-title">
          <div className="section-heading upload-heading">
            <div>
              <p className="eyebrow">NOVO ARQUIVO</p>
              <h2 id="upload-title">Adicionar</h2>
            </div>
            <span className="section-index">02 / ENVIO</span>
          </div>
          <UploadPanel onUpload={handleUpload} uploading={uploading} />
          <p className="storage-note">
            <span className="storage-dot" aria-hidden="true" />
            Armazenamento local e privado
          </p>
        </aside>
      </div>
      <footer className="page-footer">
        <span>ARQUIVO PESSOAL</span>
        <span>DOCUMENTOS SOB SEU CONTROLE</span>
      </footer>
    </main>
  );
}
