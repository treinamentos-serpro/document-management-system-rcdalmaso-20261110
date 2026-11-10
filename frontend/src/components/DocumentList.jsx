function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

export function DocumentList({ documents, loading, onDownload, downloadingId }) {
  if (loading) {
    return <p className="empty-state" role="status">Carregando documentos...</p>;
  }

  if (documents.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-mark" aria-hidden="true">—</span>
        <p>Nenhum documento por aqui ainda.</p>
      </div>
    );
  }

  return (
    <div className="document-list">
      <div className="list-header" aria-hidden="true">
        <span>NOME</span>
        <span>ADICIONADO</span>
        <span>TAMANHO</span>
        <span />
      </div>
      {documents.map((document) => (
        <article className="document-row" key={document.id}>
          <div className="file-name-cell">
            <span className="file-mark" aria-hidden="true">DOC</span>
            <span className="file-name" title={document.originalName}>{document.originalName}</span>
          </div>
          <time className="file-date" dateTime={document.uploadedAt}>
            {formatDate(document.uploadedAt)}
          </time>
          <span className="file-size">{formatBytes(document.size)}</span>
          <button
            className="download-button"
            type="button"
            onClick={() => onDownload(document)}
            disabled={downloadingId === document.id}
            aria-label={`Baixar ${document.originalName}`}
            title="Baixar documento"
          >
            {downloadingId === document.id ? '...' : '↓'}
          </button>
        </article>
      ))}
    </div>
  );
}