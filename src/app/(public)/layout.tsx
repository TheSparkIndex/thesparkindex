import { getPublicSections } from "@/lib/services/sections";
import { getSettings } from "@/lib/services/settings";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PageViewTracker } from "@/components/analytics/PageViewTracker";

export default async function PublicLayout({ children }: LayoutProps<"/">) {
  const [sections, settings] = await Promise.all([getPublicSections(), getSettings()]);
  return (
    <>
      <PageViewTracker />
      <Header sections={sections} />
      <main className="flex-1">{children}</main>
      <Footer sections={sections} copyright={settings.footerCopyright} />
    </>
  );
}
