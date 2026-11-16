-- Dados iniciais de exemplo
USE educando_futuro;

INSERT INTO profissional (nome, especialidade, ativo) VALUES
  ('Profissional A', 'Terapia ocupacional', TRUE),
  ('Profissional B', 'Psicopedagogia', TRUE),
  ('Profissional C', 'Psicologia', TRUE);

INSERT INTO tipo_atendimento (nome, descricao, duracao_min) VALUES
  ('Terapia ocupacional', 'Desenvolvimento de autonomia nas atividades diárias', 50),
  ('Psicopedagogia', 'Acompanhamento de dificuldades de aprendizagem', 50),
  ('Fonoaudiologia', 'Linguagem, fala e comunicação', 40),
  ('Psicologia', 'Atendimento psicológico', 50);

INSERT INTO atendimento (data_atendimento, horario, paciente_codigo, profissional_id, tipo_id, status, observacoes) VALUES
  ('2026-10-27', '08:00', 'PAC-014', 1, 1, 'Realizado', NULL),
  ('2026-10-27', '09:00', 'PAC-022', 2, 2, 'Realizado', NULL),
  ('2026-10-27', '10:30', 'PAC-007', 1, 3, 'Agendado',  NULL),
  ('2026-10-27', '14:00', 'PAC-031', 3, 4, 'Agendado',  NULL),
  ('2026-10-27', '15:30', 'PAC-018', 2, 2, 'Cancelado', 'Responsável avisou ausência'),
  ('2026-10-28', '09:30', 'PAC-040', 3, 4, 'Agendado',  NULL),
  ('2026-10-28', '11:00', 'PAC-012', 1, 1, 'Agendado',  NULL);
