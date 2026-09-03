// page.tsx é client component (não exporta metadata); o título vira o
// page_title do GA4 e o nome da aba.
export const metadata = {
  title: "Confirme seu e-mail",
  robots: { index: false, follow: false },
};

export default function ConfirmLayout({ children }: { children: React.ReactNode }) {
  return children;
}
