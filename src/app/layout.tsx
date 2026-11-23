import "./globals.css";
import type { Metadata } from "next";
import { publicConfig as config } from "@/lib/public-config";

export const metadata: Metadata = {
  title: `${config.appName} — audit and rewrite your Amazon listing`,
  description: "Get a Listing SEO Score for your Amazon listing, see every blocker, and get a paste-ready rewrite.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
