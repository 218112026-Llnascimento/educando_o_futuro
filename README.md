# Educando para o Futuro

Aplicação web para gerenciar atendimentos terapêuticos da empresa **Educando para o Futuro**: cadastro e consulta de agendamentos, agenda diária e painel administrativo.

## Arquitetura

| Camada    | Tecnologia                       | Onde                                 |
|-----------|----------------------------------|--------------------------------------|
| Front-end | HTML, CSS e JavaScript puro      | `*.html`, `css/`, `js/`              |
| API       | Node.js + Express + mysql2       | `server/server.js`                   |
| Banco     | MySQL 8.4 (Docker)               | `db/01_schema.sql`, `db/02_seed.sql` |

O banco segue o DER: `profissional` 1:N `atendimento` N:1 `tipo_atendimento`.
`paciente_codigo` guarda apenas um código (ex.: PAC-014), não o nome do paciente (LGPD).

## Como rodar

Pré-requisito: Docker com Docker Compose.

```bash
docker compose up -d --build
```

Acesse **http://localhost:3000**.

- App/API: porta `3000`
- MySQL: porta `3307` no host (usuário `educando`, senha `educando123`, banco `educando_futuro`)

Os scripts em `db/` rodam automaticamente **apenas na primeira criação** do volume. Para recriar o banco do zero:

```bash
docker compose down -v && docker compose up -d --build
```

### Rodar a API fora do Docker (desenvolvimento)

```bash
docker compose up -d db
cd server && npm install && npm start   # conecta em localhost:3307
```

## Endpoints da API

| Método | Rota                     | Descrição                          |
|--------|--------------------------|------------------------------------|
| GET    | `/api/atendimentos`      | Lista atendimentos (com nomes)     |
| GET    | `/api/atendimentos/:id`  | Busca um atendimento               |
| POST   | `/api/atendimentos`      | Cria (409 se houver conflito)      |
| PUT    | `/api/atendimentos/:id`  | Atualiza                           |
| DELETE | `/api/atendimentos/:id`  | Exclui                             |
| GET    | `/api/profissionais`     | Profissionais ativos               |
| GET    | `/api/tipos`             | Tipos de atendimento               |
| GET    | `/api/health`            | Verifica conexão com o banco       |

Corpo de criação/edição:

```json
{ "date": "2026-10-27", "time": "10:30", "patient": "PAC-007", "proId": 1, "typeId": 3, "status": "agendado", "obs": "" }
```
