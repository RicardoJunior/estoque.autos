import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-12">
      <Link
        href="/"
        className="mb-8 text-xl font-bold tracking-tight text-[var(--color-ink)]"
      >
        estoque<span className="text-[var(--color-brand)]">.autos</span>
      </Link>
      <div className="w-full max-w-md rounded-xl bg-card p-8 text-card-foreground ring-1 ring-foreground/10">
        {children}
      </div>
    </div>
  );
}
