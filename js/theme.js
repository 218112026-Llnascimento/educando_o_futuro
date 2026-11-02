/* Aplica o tema salvo antes da primeira pintura (evita "flash" de tema). */
try {
  const saved = localStorage.getItem("epf:theme");
  if (saved === "dark" || saved === "light") document.documentElement.dataset.theme = saved;
} catch {
  /* storage indisponível: segue a preferência do sistema */
}
