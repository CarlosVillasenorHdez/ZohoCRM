const base = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export const IconoHoy = () => (
  <svg {...base} aria-hidden><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
);
export const IconoEmbudo = () => (
  <svg {...base} aria-hidden><path d="M3 5h18l-7 8v6l-4 2v-8z" /></svg>
);
export const IconoContactos = () => (
  <svg {...base} aria-hidden><circle cx="12" cy="8" r="3.5" /><path d="M4.5 20c1-4 4-6 7.5-6s6.5 2 7.5 6" /></svg>
);
export const IconoAgenda = () => (
  <svg {...base} aria-hidden><rect x="3.5" y="5" width="17" height="15" rx="2" /><path d="M3.5 10h17M8 3.5v3M16 3.5v3" /></svg>
);
export const IconoUsuarios = () => (
  <svg {...base} aria-hidden><circle cx="9" cy="9" r="3" /><path d="M3 19c.8-3.2 3-5 6-5s5.2 1.8 6 5M16 7.5a3 3 0 010 5.5" /></svg>
);
export const IconoPolizas = () => (
  <svg {...base} aria-hidden><path d="M6 3.5h8l4 4v13H6z" /><path d="M14 3.5v4h4M9 13h6M9 16.5h4" /></svg>
);
