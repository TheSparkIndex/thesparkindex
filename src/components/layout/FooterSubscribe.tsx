"use client";

import { usePathname } from "next/navigation";
import { NewsletterSubscribe } from "@/components/public/NewsletterSubscribe";

export function FooterSubscribe() {
  const pathname = usePathname();
  if (pathname === "/") return null;
  return (
    <div className="mt-8 border-t border-white/15 pt-8">
      <NewsletterSubscribe compact />
    </div>
  );
}