import type { Metadata } from "next";
import { Albert_Sans } from "next/font/google";
import { SITE } from "@/lib/site";
import "./globals.css";

const albert = Albert_Sans({
  variable: "--font-albert",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const siteName = SITE.name;

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: siteName,
    template: `%s · ${siteName}`,
  },
  description:
    "La revista digital hecha por y para la comunidad de Key Institute. Ciencia, ingeniería, opinión, entrevistas y las historias que definen a Key.",
  openGraph: {
    siteName,
    type: "website",
    locale: "es_SV",
  },
  twitter: {
    card: "summary_large_image",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${albert.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-key-white text-key-ink">
        {children}
      </body>
    </html>
  );
}
