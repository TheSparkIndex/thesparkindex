"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="container-key flex flex-1 items-center py-20">
      <div className="mx-auto max-w-md text-center">
        <span className="stamp inline-flex bg-key-orange text-white">oops</span>
        <h1 className="display mt-4 text-3xl sm:text-4xl">Algo chispó.</h1>
        <p className="mt-3 text-key-muted">
          Ocurrió un error inesperado. Inténtalo de nuevo, o vuelve al inicio.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 inline-flex h-10 items-center gap-2 rounded-full bg-key-primary px-5 text-sm font-bold text-white hover:bg-key-primary-dark"
        >
          Reintentar
        </button>
      </div>
    </section>
  );
}
