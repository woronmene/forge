import type { Metadata } from "next";

import { Providers } from "@/components/providers";
import { rootFontClassName } from "@/lib/fonts";

import "./globals.css";

export const metadata: Metadata = {
  title: "Forge",
  description: "Media operations dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light" style={{ colorScheme: "light" }} suppressHydrationWarning>
      <body className={rootFontClassName}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
