"use client";

/** Último recurso: atrapa fallos del layout raíz, donde error.tsx ya no aplica. */
export default function ErrorGlobal({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es-MX">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          background: "#fbfaf7",
          color: "#16202a",
          padding: "3rem 1.5rem",
          maxWidth: "36rem",
        }}
      >
        <h1 style={{ fontSize: "1.5rem", fontWeight: 600 }}>La aplicación no arrancó</h1>
        <p style={{ color: "#5a6b78", marginTop: ".5rem" }}>
          Suele ser configuración incompleta del despliegue. Abre <code>/estado</code>{" "}
          para ver si falta alguna variable de entorno.
        </p>
        <p style={{ marginTop: "1.5rem", fontSize: ".875rem", wordBreak: "break-all" }}>
          {error.digest ?? error.message}
        </p>
        <button
          onClick={reset}
          style={{
            marginTop: "1.5rem",
            background: "#16202a",
            color: "#fbfaf7",
            border: 0,
            borderRadius: 6,
            padding: ".65rem 1rem",
          }}
        >
          Reintentar
        </button>
      </body>
    </html>
  );
}
