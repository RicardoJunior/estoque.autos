"use client";

import { useEffect } from "react";

// Substitui o root layout quando ele quebra: precisa de <html>/<body> próprios
// e não tem acesso ao globals.css — tudo inline e auto-contido.
export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px 16px",
          textAlign: "center",
          background: "#0a0b0d",
          color: "#f4f1ea",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
        }}
      >
        <title>Algo deu errado · estoque.autos</title>
        <p
          style={{
            margin: "0 0 32px",
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: "-0.025em",
          }}
        >
          estoque<span style={{ color: "#ff7a1a" }}>.autos</span>
        </p>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>
          Algo deu errado
        </h1>
        <p
          style={{
            margin: "8px 0 0",
            maxWidth: 384,
            fontSize: 14,
            color: "#9a9d97",
          }}
        >
          Tivemos uma falha inesperada. Tente de novo em instantes.
        </p>
        <button
          onClick={() => unstable_retry()}
          style={{
            marginTop: 32,
            border: "none",
            borderRadius: 8,
            padding: "10px 20px",
            fontSize: 14,
            fontWeight: 600,
            background: "#ff7a1a",
            color: "#1a1006",
            cursor: "pointer",
          }}
        >
          Tentar de novo
        </button>
        {/* global-error substitui o root layout inteiro: âncora crua de
            propósito — um full reload é o que queremos num app quebrado. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a
          href="/"
          style={{ marginTop: 24, fontSize: 14, color: "#9a9d97" }}
        >
          Ir para o início
        </a>
      </body>
    </html>
  );
}
