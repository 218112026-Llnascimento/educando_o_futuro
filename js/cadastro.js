/* Página Cadastro: cria um atendimento ou edita um existente (cadastro.html?id=N). */
(() => {
  "use strict";
  const { $, el, icon, setDay, store } = window.EPF;
  const data = store.load();
  const editing = data.find((a) => a.id === Number(new URLSearchParams(location.search).get("id"))) || null;

  const F = { data: $("#c-data"), hora: $("#c-hora"), pac: $("#c-pac"), prof: $("#c-prof"), tipo: $("#c-tipo"), status: $("#c-status"), obs: $("#c-obs") };
  const RULES = ["Preencha todos os campos *", "Data não pode ser vazia", "Horário inválido", "Já existe atendimento neste horário para o profissional"];

  const showMsgs = (list) => $("#msgs").replaceChildren(...list.map((text) => el("li", { textContent: text })));
  const clearInvalid = () => Object.values(F).forEach((f) => f.removeAttribute("aria-invalid"));

  function resetFeedback() {
    clearInvalid();
    showMsgs(RULES);
    $("#ok").replaceChildren();
  }

  function fillForm(a) {
    F.data.value = a ? a.date : "";
    F.hora.value = a ? a.time : "";
    F.pac.value = a ? a.patient : "";
    F.prof.value = a ? a.pro : "";
    F.tipo.value = a ? a.type : "";
    F.status.value = a ? a.status : "agendado";
    F.obs.value = a ? a.obs || "" : "";
    resetFeedback();
  }

  $("#form").addEventListener("reset", () => setTimeout(resetFeedback));

  $("#form").addEventListener("submit", (e) => {
    e.preventDefault();
    const rec = { date: F.data.value, time: F.hora.value, patient: F.pac.value.trim(), pro: F.prof.value, type: F.tipo.value, status: F.status.value, obs: F.obs.value.trim() };
    const bad = [], errors = [];
    if (!rec.date) bad.push(F.data);
    if (!rec.time) bad.push(F.hora);
    if (!rec.patient) bad.push(F.pac);
    if (!rec.pro) bad.push(F.prof);
    if (!rec.type) bad.push(F.tipo);
    if (bad.length) errors.push(RULES[0]);
    if (!rec.date) errors.push(RULES[1]);
    if (!rec.time) errors.push(RULES[2]);
    const conflict = rec.date && rec.time && rec.pro && data.some((a) =>
      a !== editing && a.status !== "cancelado" && a.date === rec.date && a.time === rec.time && a.pro === rec.pro);
    if (conflict) { errors.push(RULES[3]); bad.push(F.hora, F.prof); }

    clearInvalid();
    $("#ok").replaceChildren();
    if (errors.length) {
      bad.forEach((f) => f.setAttribute("aria-invalid", "true"));
      showMsgs(errors);
      bad[0].focus();
      return;
    }

    if (editing) Object.assign(editing, rec); else data.push({ id: store.nextId(data), ...rec });
    store.save(data);
    setDay(rec.date);
    if (editing) showMsgs(RULES); else fillForm(null);
    $("#ok").replaceChildren(el("div", { className: "note note-ok" }, icon("i-check"),
      el("span", {}, "Atendimento salvo com sucesso! ", el("a", { href: "consulta.html", textContent: "Ver na agenda" }))));
  });

  if (editing) {
    $("#t-cad").textContent = "Editar atendimento";
    document.title = "Editar atendimento · Educando para o Futuro";
  }
  fillForm(editing);
})();
