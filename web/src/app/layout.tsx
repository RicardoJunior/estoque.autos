import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Estoque.autos — seu site de loja de carros em minutos",
    template: "%s · Estoque.autos",
  },
  description:
    "Crie a conta da sua loja, cadastre o estoque e tenha um site profissional pronto em minutos.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
