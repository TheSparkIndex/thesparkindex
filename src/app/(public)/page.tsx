import Link from "next/link";
import { Zap } from "lucide-react";
import {
  getFeaturedArticle,
  getLatestArticles,
  getArticlesBySection,
} from "@/lib/services/articles";
import { getPublicSections } from "@/lib/services/sections";
import { getSettings } from "@/lib/services/settings";
import { ArticleHero } from "@/components/articles/ArticleHero";
import { MagazineGrid } from "@/components/articles/MagazineGrid";
import { SectionBlock } from "@/components/articles/SectionBlock";
import { HomeBanner } from "@/components/public/HomeBanner";
import { NewsletterSubscribe } from "@/components/public/NewsletterSubscribe";
import { Container } from "@/components/ui/Container";

export const revalidate = 300;

const SECTION_CONFIG: Record<string, { layout: "row" | "list" | "single"; perPage: number }> = {
  noticias: { layout: "row", perPage: 3 },
  opinion: { layout: "list", perPage: 3 },
  entrevistas: { layout: "single", perPage: 2 },
  "ciencia-ingenieria": { layout: "list", perPage: 3 },
  "valores-key": { layout: "single", perPage: 2 },
};

export default async function HomePage() {
  const sections = await getPublicSections();
  const sectionBlocks = sections.filter((s) => SECTION_CONFIG[s.slug]);
  const settings = await getSettings();

  const [featured, latest, ...sectionsData] = await Promise.all([
    getFeaturedArticle(),
    getLatestArticles(12),
    ...sectionBlocks.map((s) =>
      getArticlesBySection(s.slug, { perPage: SECTION_CONFIG[s.slug].perPage })
    ),
  ]);

  const hero = featured ?? latest[0];
  const latestOthers = latest.filter((a) => a.id !== hero?.id).slice(0, 10);

  return (
    <>
      {settings.bannerEnabled && settings.bannerTitle && (
        <HomeBanner
          title={settings.bannerTitle}
          subtitle={settings.bannerSubtitle}
          articleSlug={settings.bannerArticleSlug}
          backgroundColor={settings.bannerBgColor}
          textColor={settings.bannerTextColor}
          buttonBgColor={settings.bannerButtonBgColor}
          buttonTextColor={settings.bannerButtonTextColor}
        />
      )}

      <section className="container-key flex flex-col gap-8 py-10 sm:py-14">
        {/* Intro de portada (oculta temporalmente, puede reincorporarse)
        <div className="flex items-center gap-3">
          <Zap className="size-5 text-key-orange" aria-hidden />
          <p className="display text-xl sm:text-2xl">
            Lo que los estudiantes de <span className="text-key-primary">Key</span> están{" "}
            <span className="marker-lime">creando</span>, explicando y contando.
          </p>
        </div>
        */}

        {hero && <ArticleHero article={hero} />}
      </section>

      {latestOthers.length > 0 && (
        <section className="border-t-2 border-key-ink/80 bg-key-surface-alt/60 py-12 sm:py-16">
          <Container>
            <div className="mb-8">
              <h2 className="display text-3xl sm:text-4xl">Últimas historias</h2>
            </div>
            <MagazineGrid articles={latestOthers} />
          </Container>
        </section>
      )}

      <div className="container-key flex flex-col">
        {sectionBlocks.map((s, i) => (
          <SectionBlock
            key={s.slug}
            sectionSlug={s.slug}
            articles={sectionsData[i].items}
            layout={SECTION_CONFIG[s.slug].layout}
            meta={s}
          />
        ))}
      </div>

      <NewsletterSubscribe />

      <section className="relative overflow-hidden bg-key-ink py-16 text-white">
        <div className="bg-dotgrid-ink absolute inset-0 opacity-40" aria-hidden />
        <Container className="relative flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="display mt-1 text-3xl sm:text-4xl">
              Las historias de Key recién salidas del laboratorio.
            </h2>
            <p className="mt-3 max-w-xl text-white/70">
              Ciencia, ingeniería, opinión y comunidad. La revista de quienes ya
              están construyendo el futuro.
            </p>
          </div>
          <Link
            href="/buscar"
            className="inline-flex h-12 shrink-0 items-center gap-2 rounded-full bg-key-primary px-7 text-base font-bold text-white transition-all hover:gap-3 hover:brightness-95"
          >
            Explora la revista <Zap className="size-4" aria-hidden />
          </Link>
        </Container>
      </section>
    </>
  );
}
