-- Esquema do banco educando_futuro (conforme o DER)
CREATE DATABASE IF NOT EXISTS educando_futuro CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE educando_futuro;

CREATE TABLE profissional (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  nome          VARCHAR(100) NOT NULL,
  especialidade VARCHAR(80),
  ativo         BOOLEAN DEFAULT TRUE
);

CREATE TABLE tipo_atendimento (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  nome         VARCHAR(80) NOT NULL,
  descricao    TEXT,
  duracao_min  INT
);

CREATE TABLE atendimento (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  data_atendimento DATE NOT NULL,
  horario          TIME NOT NULL,
  paciente_codigo  VARCHAR(50) NOT NULL,
  profissional_id  INT NOT NULL,
  tipo_id          INT NOT NULL,
  status           ENUM('Agendado','Realizado','Cancelado') NOT NULL DEFAULT 'Agendado',
  observacoes      TEXT,
  data_criacao     DATETIME DEFAULT CURRENT_TIMESTAMP,
  data_atualizacao DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_atendimento_profissional FOREIGN KEY (profissional_id) REFERENCES profissional(id),
  CONSTRAINT fk_atendimento_tipo         FOREIGN KEY (tipo_id)         REFERENCES tipo_atendimento(id),
  INDEX idx_atendimento_data (data_atendimento)
);
