import type { Metadata } from "next";
import { Anton, Archivo } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

// Display (títulos) + corpo — compartilhados por todo o produto (landing + app).
const display = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
});
const sans = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
});

export const metadata: Metadata = {
  title: {
    default: "estoque.autos — seu site de loja de carros em minutos",
    template: "%s · estoque.autos",
  },
  description:
    "Crie a conta da sua loja, cadastre o estoque e tenha um site profissional pronto em minutos.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="pt-BR"
      className={cn("dark", display.variable, sans.variable)}
      suppressHydrationWarning
    >
      <body>
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
