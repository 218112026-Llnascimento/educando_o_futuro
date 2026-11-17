(async () => {
  "use strict";
  const { $, el, icon, setDay, api, fillSelect } = window.EPF;

  const F = { data: $("#c-data"), hora: $("#c-hora"), pac: $("#c-pac"), prof: $("#c-prof"), tipo: $("#c-tipo"), status: $("#c-status"), obs: $("#c-obs") };
  const RULES = ["Preencha todos os campos *", "Data não pode ser vazia", "Horário inválido", "Já existe atendimento neste horário para o profissional"];

  const showMsgs = (list) => $("#msgs").replaceChildren(...list.map((text) => el("li", { textContent: text })));
  const clearInvalid = () => Object.values(F).forEach((f) => f.removeAttribute("aria-invalid"));
  const submitBtn = $("#form").querySelector('[type="submit"]');

  let data = [];
  let editing = null;

  function resetFeedback() {
    clearInvalid();
    showMsgs(RULES);
    $("#ok").replaceChildren();
  }

  function fillForm(a) {
    F.data.value = a ? a.date : "";
    F.hora.value = a ? a.time : "";
    F.pac.value = a ? a.patient : "";
    F.prof.value = a ? String(a.proId) : "";
    F.tipo.value = a ? String(a.typeId) : "";
    F.status.value = a ? a.status : "agendado";
    F.obs.value = a ? a.obs || "" : "";
    resetFeedback();
  }

  $("#form").addEventListener("reset", () => setTimeout(resetFeedback));

  $("#form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const rec = { date: F.data.value, time: F.hora.value, patient: F.pac.value.trim(), proId: Number(F.prof.value), typeId: Number(F.tipo.value), status: F.status.value, obs: F.obs.value.trim() };
    const bad = [], errors = [];
    if (!rec.date) bad.push(F.data);
    if (!rec.time) bad.push(F.hora);
    if (!rec.patient) bad.push(F.pac);
    if (!rec.proId) bad.push(F.prof);
    if (!rec.typeId) bad.push(F.tipo);
    if (bad.length) errors.push(RULES[0]);
    if (!rec.date) errors.push(RULES[1]);
    if (!rec.time) errors.push(RULES[2]);
    const conflict = rec.date && rec.time && rec.proId && rec.status !== "cancelado" && data.some((a) =>
      (!editing || a.id !== editing.id) && a.status !== "cancelado" && a.date === rec.date && a.time === rec.time && a.proId === rec.proId);
    if (conflict) { errors.push(RULES[3]); bad.push(F.hora, F.prof); }

    clearInvalid();
    $("#ok").replaceChildren();
    if (errors.length) {
      bad.forEach((f) => f.setAttribute("aria-invalid", "true"));
      showMsgs(errors);
      bad[0].focus();
      return;
    }

    submitBtn.disabled = true;
    try {
      const saved = editing ? await api.atualizar(editing.id, rec) : await api.criar(rec);
      if (editing) { editing = saved; data = data.map((a) => (a.id === saved.id ? saved : a)); } else data.push(saved);
      setDay(rec.date);
      if (editing) showMsgs(RULES); else fillForm(null);
      $("#ok").replaceChildren(el("div", { className: "note note-ok" }, icon("i-check"),
        el("span", {}, "Atendimento salvo com sucesso! ", el("a", { href: "consulta.html", textContent: "Ver na agenda" }))));
    } catch (err) {
      if (err.status === 409) [F.hora, F.prof].forEach((f) => f.setAttribute("aria-invalid", "true"));
      showMsgs(err.errors || ["Não foi possível salvar o atendimento."]);
    } finally {
      submitBtn.disabled = false;
    }
  });

  try {
    const [pros, tipos, lista] = await Promise.all([api.profissionais(), api.tipos(), api.atendimentos()]);
    fillSelect(F.prof, pros, (p) => p.id, (p) => p.nome);
    fillSelect(F.tipo, tipos, (t) => t.id, (t) => t.nome);
    data = lista;
  } catch (err) {
    showMsgs(err.errors || ["Erro ao carregar dados do servidor."]);
    submitBtn.disabled = true;
    return;
  }

  const id = Number(new URLSearchParams(location.search).get("id"));
  editing = (id && data.find((a) => a.id === id)) || null;
  if (editing) {
    $("#t-cad").textContent = "Editar atendimento";
    document.title = "Editar atendimento · Educando para o Futuro";
  }
  fillForm(editing);
})();
