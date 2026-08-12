import type { Metadata } from "next";
import { getActiveAuthors } from "@/lib/services/authors";
import { AuthorCard } from "@/components/authors/AuthorCard";

export const metadata: Metadata = {
  title: "Nuestros autores",
  description: "Los estudiantes, profesores y mentores que escriben en KEY — The Spark Index.",
};

export default async function AuthorsPage() {
  const authors = await getActiveAuthors();
  return (
    <>
      <section className="container-key py-12 sm:py-16">
        <span className="hand block -rotate-2 text-2xl text-key-primary">las voces</span>
        <h1 className="display text-4xl sm:text-5xl">Nuestros autores</h1>
        <p className="mt-3 max-w-xl text-key-muted">
          Estudiantes, docentes y mentores que escriben, entrevistan, fotografían y editan cada historia.
        </p>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {authors.map((a) => (
            <AuthorCard key={a.id} author={a} />
          ))}
        </div>
      </section>
    </>
  );
}
