/* Página Consulta: lista, filtra, pagina e exclui atendimentos. */
(() => {
  "use strict";
  const { $, el, icon, cell, fmtDate, byWhen, getDay, setDay, store, LABEL, ICON } = window.EPF;
  const PAGE_SIZE = 5;
  let data = store.load();
  let page = 1;
  let deleting = null;

  const dateInput = $("#f-data");
  dateInput.value = getDay();

  const filtered = () => {
    const date = dateInput.value, pro = $("#f-prof").value, status = $("#f-status").value;
    return data
      .filter((a) => (!date || a.date === date) && (!pro || a.pro === pro) && (!status || a.status === status))
      .sort(byWhen);
  };

  function renderRows(slice) {
    const body = $("#corpo");
    body.replaceChildren();
    if (!slice.length) {
      body.append(el("tr", {}, el("td", { colSpan: 6, className: "empty", textContent: "Nenhum atendimento encontrado. Ajuste os filtros ou crie um novo atendimento." })));
      return;
    }
    slice.forEach((a) => {
      const edit = el("a", { className: "btn btn-sm btn-edit", href: `cadastro.html?id=${a.id}` }, icon("i-edit"), "Editar");
      const del = el("button", { type: "button", className: "btn btn-sm btn-del" }, icon("i-trash"), "Excluir");
      edit.setAttribute("aria-label", `Editar atendimento de ${a.patient} às ${a.time}`);
      del.setAttribute("aria-label", `Excluir atendimento de ${a.patient} às ${a.time}`);
      del.addEventListener("click", () => askDelete(a));
      const actions = cell("Ações", el("div", { className: "row-actions" }, edit, del));
      actions.className = "td-actions";
      body.append(el("tr", {},
        cell("Horário", el("span", { className: "time" }, icon("i-clock"), a.time)),
        cell("Paciente", a.patient), cell("Profissional", a.pro), cell("Tipo", a.type),
        cell("Status", el("span", { className: "badge s-" + a.status }, icon(ICON[a.status]), LABEL[a.status])),
        actions));
    });
  }

  function renderSummary(list) {
    const count = (s) => list.filter((a) => a.status === s).length;
    const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
    const item = (cls, ico, text) => { const i = icon(ico); i.classList.add(cls); return el("li", {}, i, text); };
    const date = dateInput.value;
    $("#resumo").replaceChildren(
      item("st-all", "i-cal", plural(list.length, "atendimento", "atendimentos") + (date ? " em " + fmtDate(date) : "")),
      item("st-ok", "i-check", plural(count("realizado"), "realizado", "realizados")),
      item("st-warn", "i-clock", plural(count("agendado"), "agendado", "agendados")),
      item("st-bad", "i-x", plural(count("cancelado"), "cancelado", "cancelados")));
  }

  function renderPager(pages) {
    const pager = $("#pager");
    const button = (label, to, disabled, content) => {
      const b = el("button", { type: "button", disabled }, content);
      b.setAttribute("aria-label", label);
      b.addEventListener("click", () => { page = to; render(); });
      return b;
    };
    pager.replaceChildren(button("Página anterior", page - 1, page === 1, icon("i-left")));
    for (let p = 1; p <= pages; p++) {
      const b = button("Página " + p, p, false, String(p));
      if (p === page) b.setAttribute("aria-current", "page");
      pager.append(b);
    }
    pager.append(button("Próxima página", page + 1, page === pages, icon("i-right")));
  }

  function render() {
    const list = filtered();
    const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
    page = Math.min(page, pages);
    renderRows(list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE));
    renderSummary(list);
    renderPager(pages);
  }

  const dialog = $("#dlg-del");
  function askDelete(a) {
    deleting = a;
    $("#del-txt").textContent = `${a.patient} · ${a.type} · ${fmtDate(a.date)} às ${a.time}. Essa ação não pode ser desfeita.`;
    dialog.showModal();
  }
  dialog.addEventListener("close", () => {
    if (dialog.returnValue === "yes" && deleting) {
      data = data.filter((a) => a.id !== deleting.id);
      store.save(data);
      render();
    }
    deleting = null;
    dialog.returnValue = "";
  });

  $("#filtros").addEventListener("submit", (e) => { e.preventDefault(); page = 1; render(); });
  ["#f-data", "#f-prof", "#f-status"].forEach((sel) => $(sel).addEventListener("change", () => {
    if (sel === "#f-data") setDay(dateInput.value);
    page = 1;
    render();
  }));

  render();
})();
