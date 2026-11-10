# Especificação — Document Management System

## 1. Objetivo

Permitir que usuários enviem, listem e baixem seus documentos, mantendo os arquivos no filesystem local da aplicação e os metadados em memória.

## 2. Escopo

### Dentro do escopo

- Envio de um arquivo por requisição.
- Listagem de documentos pertencentes ao usuário da requisição.
- Download de um documento por identificador, limitado ao proprietário.
- Interface web para envio, listagem e download.
- Armazenamento local com `multer` e `diskStorage`.
- Metadados mantidos em memória enquanto o processo estiver ativo.

### Fora do escopo

- Armazenamento em nuvem ou em serviços externos.
- Versionamento, edição ou exclusão de documentos.
- Persistência de metadados após reinício do processo.
- Cadastro e autenticação de contas de usuário.
- Busca avançada, paginação e compartilhamento de documentos.

## 3. Requisitos funcionais

| ID | Requisito |
|---|---|
| RF-01 | O sistema deve aceitar um arquivo enviado como `multipart/form-data`, no campo `file`. |
| RF-02 | O sistema deve gerar um identificador único e um nome interno de armazenamento que não dependa do nome enviado pelo usuário. |
| RF-03 | O sistema deve gravar o arquivo localmente usando `multer` com `diskStorage`. |
| RF-04 | O sistema deve registrar em memória o identificador, nome original, tamanho, data de envio e proprietário do documento. |
| RF-05 | O sistema deve listar somente documentos pertencentes ao usuário identificado na requisição. |
| RF-06 | O sistema deve permitir o download pelo identificador somente ao proprietário. |
| RF-07 | O sistema deve comunicar erros de entrada, limite excedido e falha de armazenamento. |
| RF-08 | A interface deve permitir envio, consulta e download dos documentos do usuário. |

## 4. Requisitos não funcionais

| ID | Requisito |
|---|---|
| RNF-01 | Os arquivos devem permanecer no filesystem local, em `backend/storage` por padrão. Provedores externos não são permitidos. |
| RNF-02 | Os metadados permanecem em memória; reiniciar o processo os apaga e pode deixar arquivos locais órfãos. |
| RNF-03 | Porta, diretório e limite de upload devem ser configuráveis por variáveis de ambiente. |
| RNF-04 | O nome original não deve ser usado como caminho de gravação. Downloads devem ser enviados como anexos. |
| RNF-05 | O backend deve seguir `routes -> controllers -> services -> repositories`; camadas internas não dependem de Express. |
| RNF-06 | O frontend usa `fetch` sob o prefixo `/api`; o proxy Vite remove esse prefixo no ambiente de desenvolvimento. |
| RNF-07 | A implementação deve usar JavaScript, Express, React e dependências existentes. |

## 5. Modelo de dados

| Campo | Tipo | API | Descrição |
|---|---|---|---|
| `id` | string | Sim | UUID único do documento. |
| `originalName` | string | Sim | Nome original informado no upload; não define o caminho local. |
| `size` | number | Sim | Tamanho em bytes. |
| `uploadedAt` | string | Sim | Data e hora do upload em ISO 8601, UTC. |
| `owner` | string | Sim | Identificador do usuário proprietário. |
| `storageName` | string | Não | Nome UUID gerado para o arquivo local. |
| `mimeType` | string | Não | Tipo informado pelo cliente, mantido apenas como metadado interno. |

Os caminhos físicos não são retornados pela API. O repositório resolve o caminho usando o diretório configurado e o nome interno.

## 6. Contratos de API

Todas as rotas abaixo são montadas na raiz do backend. No frontend, são acessadas com `/api`, prefixo removido pelo proxy de desenvolvimento. Todas requerem `X-User-Id` não vazio. Esse cabeçalho identifica o proprietário no MVP, mas não autentica o solicitante e não oferece proteção adequada para produção.

### `POST /upload`

- Entrada: `multipart/form-data` com o campo `file` e cabeçalho `X-User-Id`.
- Sucesso: `201 Created`, corpo com os metadados públicos do documento.
- Erros: `400` para arquivo ausente ou entrada inválida; `401` sem usuário; `413` quando o arquivo ultrapassar o limite; `500` em falha interna.
- O arquivo é gravado com nome UUID. Se o registro em memória falhar, o sistema tenta remover o arquivo recém-gravado.

### `GET /documents`

- Entrada: cabeçalho `X-User-Id`.
- Sucesso: `200 OK`, `{ "documents": [...] }`, somente documentos do usuário; lista vazia é válida.
- Erro: `401` sem usuário.

### `GET /documents/:id/download`

- Entrada: identificador na URL e cabeçalho `X-User-Id`.
- Sucesso: `200 OK`, conteúdo binário como anexo com nome original sanitizado.
- Erros: `401` sem usuário; `404` se o documento não existir, não pertencer ao usuário ou o arquivo não estiver disponível.
- Não revelar se um identificador pertence a outro usuário.

### Formato de erro

```json
{
  "error": {
    "code": "DOCUMENT_NOT_FOUND",
    "message": "Documento não encontrado."
  }
}
```

### Configuração

| Variável | Padrão | Uso |
|---|---|---|
| `PORT` | `3000` | Porta HTTP do backend. |
| `STORAGE_DIR` | `backend/storage` | Diretório local de arquivos. |
| `MAX_FILE_SIZE_BYTES` | `10485760` | Limite de upload (10 MiB). |

## 7. Decisões arquiteturais

- `routes/` declara caminhos e encadeia middlewares.
- `controllers/` valida a entrada HTTP e converte resultados em respostas.
- `services/` aplica as regras de propriedade, metadados e download.
- `repositories/` mantém os metadados em memória e resolve/remover arquivos no filesystem local.
- Multer com `diskStorage` grava arquivos com nome UUID; o nome original é preservado apenas como metadado.
- O frontend organiza a interação em componentes e acessa a API por um serviço `fetch`.
- `X-User-Id` é uma convenção de desenvolvimento, não mecanismo de autenticação.

## 8. Plano de execução

1. Consolidar requisitos, modelo de dados, contratos e decisões arquiteturais neste documento.
2. Implementar repositório em memória, serviço de documentos, controller, rotas e tratamento de erros; validar upload local, isolamento por proprietário, limite e download com testes automatizados.
3. Implementar serviço `fetch` e componentes React para envio, listagem, identificação do usuário e download; tratar carregamento, vazio e erros.
4. Validar build do frontend e integração com o backend pelo proxy Vite; verificar configuração e fluxo ponta a ponta.
5. Registrar limites conhecidos: metadados voláteis e identidade não autenticada; não introduzir persistência externa ou provedor de arquivos.