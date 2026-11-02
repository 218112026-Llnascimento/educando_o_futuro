/* Página Painel: indicadores, próximos compromissos e gráficos do dia selecionado. */
(() => {
  "use strict";
  const { $, el, cell, fmtDate, byWhen, shiftDay, getDay, setDay, store, PROS } = window.EPF;
  const data = store.load();
  let day = getDay();

  const kpi = (label, n, color, ink) => {
    const li = el("li", { className: "kpi" }, el("span", { textContent: label }),
      el("div", {}, el("strong", { textContent: String(n) }), el("small", { textContent: n === 1 ? "atendimento" : "atendimentos" })));
    li.style.setProperty("--c", color);
    if (ink) li.style.setProperty("--n", ink);
    return li;
  };

  function renderBars(target, rows) {
    const max = Math.max(1, ...rows.map((r) => r[1]));
    target.replaceChildren(...rows.map(([label, n, color]) => {
      const fill = el("div", { className: "fill" });
      fill.style.width = (n / max) * 100 + "%";
      fill.style.background = color;
      const track = el("div", { className: "track" }, fill);
      track.setAttribute("aria-hidden", "true"); // o número ao lado já informa o valor
      return el("li", {}, el("span", { textContent: label }), track, el("b", { textContent: String(n) }));
    }));
  }

  function render() {
    const list = data.filter((a) => a.date === day);
    const count = (s) => list.filter((a) => a.status === s).length;
    $("#d-label").textContent = fmtDate(day);

    $("#stats").replaceChildren(
      kpi("Total do dia", list.length, "var(--ink2)"),
      kpi("Agendados", count("agendado"), "var(--gold)", "var(--gold-ink)"),
      kpi("Realizados", count("realizado"), "var(--ok)"),
      kpi("Cancelados", count("cancelado"), "var(--bad)"));

    renderBars($("#bar-status"), [["Agendados", count("agendado"), "var(--gold)"], ["Realizados", count("realizado"), "var(--ok)"], ["Cancelados", count("cancelado"), "var(--bad)"]]);
    renderBars($("#bar-pro"), PROS.map((p) => [p, list.filter((a) => a.pro === p).length, "var(--ink2)"]));

    const next = data.filter((a) => a.status === "agendado" && a.date >= day).sort(byWhen).slice(0, 4);
    $("#proximos").replaceChildren(...(next.length
      ? next.map((a) => el("tr", {},
          cell("Horário", el("span", { className: "pill", textContent: a.date === day ? a.time : `${fmtDate(a.date).slice(0, 5)} ${a.time}` })),
          cell("Paciente", a.patient), cell("Profissional", a.pro), cell("Tipo", a.type)))
      : [el("tr", {}, el("td", { colSpan: 4, className: "empty", textContent: "Nenhum compromisso agendado a partir desta data." }))]));
  }

  const move = (n) => { day = shiftDay(day, n); setDay(day); render(); };
  $("#d-prev").addEventListener("click", () => move(-1));
  $("#d-next").addEventListener("click", () => move(1));
  render();
})();
