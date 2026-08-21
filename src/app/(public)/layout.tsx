import { getPublicSections } from "@/lib/services/sections";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export default async function PublicLayout({ children }: LayoutProps<"/">) {
  const sections = await getPublicSections();
  return (
    <>
      <Header sections={sections} />
      <main className="flex-1">{children}</main>
      <Footer sections={sections} />
    </>
  );
}
