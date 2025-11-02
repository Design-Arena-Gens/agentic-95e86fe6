import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Editor Avançado",
  description: "Editor de texto rico com tooltips para publicação na web"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
