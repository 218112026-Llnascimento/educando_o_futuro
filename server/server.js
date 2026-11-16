/* Servidor web + API REST do sistema Educando para o Futuro (Express + MySQL). */
"use strict";
const path = require("path");
const express = require("express");
const mysql = require("mysql2/promise");

const PORT = Number(process.env.PORT) || 3000;
const PUBLIC_DIR = process.env.PUBLIC_DIR || path.join(__dirname, "..");

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3307,
  user: process.env.DB_USER || "educando",
  password: process.env.DB_PASSWORD || "educando123",
  database: process.env.DB_NAME || "educando_futuro",
  dateStrings: true, // DATE/TIME chegam como texto (sem conversão de fuso)
  waitForConnections: true,
  connectionLimit: 10,
});

// O front usa status em minúsculas; o banco guarda como no DER (Agendado, Realizado, Cancelado).
const STATUS_DB = { agendado: "Agendado", realizado: "Realizado", cancelado: "Cancelado" };

const SELECT_ATENDIMENTO = `
  SELECT a.id, a.data_atendimento, a.horario, a.paciente_codigo, a.status, a.observacoes,
         a.profissional_id, p.nome AS profissional, a.tipo_id, t.nome AS tipo
    FROM atendimento a
    JOIN profissional p ON p.id = a.profissional_id
    JOIN tipo_atendimento t ON t.id = a.tipo_id`;

const toApi = (r) => ({
  id: r.id,
  date: r.data_atendimento,
  time: r.horario.slice(0, 5),
  patient: r.paciente_codigo,
  proId: r.profissional_id,
  pro: r.profissional,
  typeId: r.tipo_id,
  type: r.tipo,
  status: r.status.toLowerCase(),
  obs: r.observacoes || "",
});

function validate(body) {
  const rec = {
    date: String(body.date || ""),
    time: String(body.time || ""),
    patient: String(body.patient || "").trim(),
    proId: Number(body.proId),
    typeId: Number(body.typeId),
    status: STATUS_DB[body.status] ? body.status : "agendado",
    obs: String(body.obs || "").trim().slice(0, 300),
  };
  const errors = [];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(rec.date)) errors.push("Data inválida");
  if (!/^\d{2}:\d{2}$/.test(rec.time)) errors.push("Horário inválido");
  if (!rec.patient || rec.patient.length > 50) errors.push("Código do paciente obrigatório (até 50 caracteres)");
  if (!Number.isInteger(rec.proId) || rec.proId < 1) errors.push("Profissional obrigatório");
  if (!Number.isInteger(rec.typeId) || rec.typeId < 1) errors.push("Tipo de atendimento obrigatório");
  return { rec, errors };
}

async function hasConflict(rec, ignoreId = 0) {
  const [rows] = await pool.query(
    `SELECT 1 FROM atendimento
      WHERE data_atendimento = ? AND horario = ? AND profissional_id = ?
        AND status <> 'Cancelado' AND id <> ? LIMIT 1`,
    [rec.date, rec.time, rec.proId, ignoreId]);
  return rows.length > 0;
}

const app = express();
app.use(express.json());

const wrap = (fn) => (req, res, next) => fn(req, res).catch(next);

app.get("/api/health", wrap(async (req, res) => {
  await pool.query("SELECT 1");
  res.json({ ok: true });
}));

app.get("/api/profissionais", wrap(async (req, res) => {
  const [rows] = await pool.query("SELECT id, nome, especialidade, ativo FROM profissional WHERE ativo = TRUE ORDER BY nome");
  res.json(rows.map((r) => ({ ...r, ativo: Boolean(r.ativo) })));
}));

app.get("/api/tipos", wrap(async (req, res) => {
  const [rows] = await pool.query("SELECT id, nome, descricao, duracao_min FROM tipo_atendimento ORDER BY nome");
  res.json(rows);
}));

app.get("/api/atendimentos", wrap(async (req, res) => {
  const [rows] = await pool.query(SELECT_ATENDIMENTO + " ORDER BY a.data_atendimento, a.horario");
  res.json(rows.map(toApi));
}));

app.get("/api/atendimentos/:id", wrap(async (req, res) => {
  const [rows] = await pool.query(SELECT_ATENDIMENTO + " WHERE a.id = ?", [Number(req.params.id)]);
  if (!rows.length) return res.status(404).json({ errors: ["Atendimento não encontrado"] });
  res.json(toApi(rows[0]));
}));

app.post("/api/atendimentos", wrap(async (req, res) => {
  const { rec, errors } = validate(req.body);
  if (errors.length) return res.status(400).json({ errors });
  if (await hasConflict(rec)) return res.status(409).json({ errors: ["Já existe atendimento neste horário para o profissional"] });
  const [result] = await pool.query(
    `INSERT INTO atendimento (data_atendimento, horario, paciente_codigo, profissional_id, tipo_id, status, observacoes)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [rec.date, rec.time, rec.patient, rec.proId, rec.typeId, STATUS_DB[rec.status], rec.obs || null]);
  const [rows] = await pool.query(SELECT_ATENDIMENTO + " WHERE a.id = ?", [result.insertId]);
  res.status(201).json(toApi(rows[0]));
}));

app.put("/api/atendimentos/:id", wrap(async (req, res) => {
  const id = Number(req.params.id);
  const { rec, errors } = validate(req.body);
  if (errors.length) return res.status(400).json({ errors });
  if (await hasConflict(rec, id)) return res.status(409).json({ errors: ["Já existe atendimento neste horário para o profissional"] });
  const [result] = await pool.query(
    `UPDATE atendimento SET data_atendimento = ?, horario = ?, paciente_codigo = ?, profissional_id = ?,
            tipo_id = ?, status = ?, observacoes = ? WHERE id = ?`,
    [rec.date, rec.time, rec.patient, rec.proId, rec.typeId, STATUS_DB[rec.status], rec.obs || null, id]);
  if (!result.affectedRows) return res.status(404).json({ errors: ["Atendimento não encontrado"] });
  const [rows] = await pool.query(SELECT_ATENDIMENTO + " WHERE a.id = ?", [id]);
  res.json(toApi(rows[0]));
}));

app.delete("/api/atendimentos/:id", wrap(async (req, res) => {
  const [result] = await pool.query("DELETE FROM atendimento WHERE id = ?", [Number(req.params.id)]);
  if (!result.affectedRows) return res.status(404).json({ errors: ["Atendimento não encontrado"] });
  res.status(204).end();
}));

app.use("/api", (req, res) => res.status(404).json({ errors: ["Rota não encontrada"] }));

// Páginas estáticas (index.html, cadastro.html, css/, js/ ...)
app.use(express.static(PUBLIC_DIR, { index: "index.html", dotfiles: "ignore" }));

app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") return res.status(400).json({ errors: ["JSON inválido"] });
  if (err.code === "ER_NO_REFERENCED_ROW_2") return res.status(400).json({ errors: ["Profissional ou tipo inexistente"] });
  console.error(err);
  res.status(500).json({ errors: ["Erro interno: não foi possível acessar o banco de dados"] });
});

app.listen(PORT, () => console.log(`Educando para o Futuro rodando em http://localhost:${PORT}`));
