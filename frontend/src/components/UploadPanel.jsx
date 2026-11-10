import { useRef, useState } from 'react';

export function UploadPanel({ onUpload, uploading }) {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);

  function acceptFile(candidate) {
    if (candidate) setFile(candidate);
  }

  async function submit(event) {
    event.preventDefault();
    if (file && await onUpload(file)) {
      setFile(null);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <form className="upload-form" onSubmit={submit}>
      <button
        className={`drop-zone${dragging ? ' is-dragging' : ''}${file ? ' has-file' : ''}`}
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          acceptFile(event.dataTransfer.files[0]);
        }}
        aria-label="Selecionar ou soltar um documento"
      >
        <span className="upload-symbol" aria-hidden="true">+</span>
        <span className="drop-title">{file ? 'Arquivo selecionado' : 'Solte seu arquivo aqui'}</span>
        <span className="drop-caption">
          {file ? file.name : 'ou escolha um arquivo do dispositivo'}
        </span>
      </button>
      <input
        ref={inputRef}
        className="visually-hidden"
        type="file"
        onChange={(event) => acceptFile(event.target.files[0])}
        aria-label="Arquivo para envio"
      />
      <button className="primary-button" type="submit" disabled={!file || uploading}>
        {uploading ? 'Enviando...' : 'Enviar documento'}
        <span aria-hidden="true">↗</span>
      </button>
      <p className="upload-hint">Um arquivo por envio. Todos os formatos são aceitos.</p>
    </form>
  );
}