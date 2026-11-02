/* Código compartilhado entre as páginas: dados (localStorage), utilitários de DOM e tema. */
(() => {
  "use strict";

  const KEYS = { data: "epf:agenda:v1", day: "epf:day", theme: "epf:theme" };
  const DEFAULT_DAY = "2026-10-27";
  const LABEL = { realizado: "Realizado", agendado: "Agendado", cancelado: "Cancelado" };
  const ICON = { realizado: "i-check", agendado: "i-clock", cancelado: "i-x" };
  const PROS = ["Profissional A", "Profissional B", "Profissional C"];

  const SEED = [
    ["2026-10-27", "08:00", "PAC-014", "Profissional A", "Terapia ocupacional", "realizado"],
    ["2026-10-27", "09:00", "PAC-022", "Profissional B", "Psicopedagogia", "realizado"],
    ["2026-10-27", "10:30", "PAC-007", "Profissional A", "Fonoaudiologia", "agendado"],
    ["2026-10-27", "14:00", "PAC-031", "Profissional C", "Psicologia", "agendado"],
    ["2026-10-27", "15:30", "PAC-018", "Profissional B", "Psicopedagogia", "cancelado"],
    ["2026-10-28", "09:30", "PAC-040", "Profissional C", "Psicologia", "agendado"],
    ["2026-10-28", "11:00", "PAC-012", "Profissional A", "Terapia ocupacional", "agendado"],
  ].map(([date, time, patient, pro, type, status], i) => ({ id: i + 1, date, time, patient, pro, type, status, obs: "" }));

  const read = (key) => { try { return localStorage.getItem(key); } catch { return null; } };
  const write = (key, value) => { try { localStorage.setItem(key, value); } catch { /* storage indisponível */ } };

  const store = {
    load() {
      try {
        const list = JSON.parse(read(KEYS.data));
        if (Array.isArray(list)) return list;
      } catch { /* dados inválidos: usa o seed */ }
      return SEED.map((a) => ({ ...a }));
    },
    save: (list) => write(KEYS.data, JSON.stringify(list)),
    nextId: (list) => list.reduce((max, a) => Math.max(max, a.id), 0) + 1,
  };

  const $ = (selector, root = document) => root.querySelector(selector);

  const el = (tag, props = {}, ...kids) => {
    const { dataset, ...rest } = props;
    const node = document.createElement(tag);
    Object.assign(node, rest);
    if (dataset) Object.assign(node.dataset, dataset);
    node.append(...kids); // strings viram texto (sem risco de XSS)
    return node;
  };

  const icon = (id) => {
    const NS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(NS, "svg");
    const use = document.createElementNS(NS, "use");
    svg.setAttribute("class", "ico");
    svg.setAttribute("aria-hidden", "true");
    use.setAttribute("href", "#" + id);
    svg.append(use);
    return svg;
  };

  const cell = (label, ...kids) => el("td", { dataset: { label } }, ...kids);
  const fmtDate = (iso) => iso.split("-").reverse().join("/");
  const byWhen = (a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time);
  const shiftDay = (iso, n) => {
    const d = new Date(iso + "T12:00:00Z");
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
  };
  const getDay = () => read(KEYS.day) || DEFAULT_DAY;
  const setDay = (iso) => write(KEYS.day, iso || DEFAULT_DAY);

  const themeButton = $("#tema");
  if (themeButton) {
    themeButton.addEventListener("click", () => {
      const root = document.documentElement;
      const dark = root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
      root.dataset.theme = dark ? "light" : "dark";
      write(KEYS.theme, root.dataset.theme);
    });
  }

  window.EPF = { $, el, icon, cell, fmtDate, byWhen, shiftDay, getDay, setDay, store, LABEL, ICON, PROS };
})();
