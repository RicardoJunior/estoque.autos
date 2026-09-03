// page.tsx é client component (não exporta metadata); o título vira o
// page_title do GA4 e o nome da aba.
export const metadata = {
  title: "Entrar com código",
  robots: { index: false, follow: false },
};

export default function LoginCodeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
