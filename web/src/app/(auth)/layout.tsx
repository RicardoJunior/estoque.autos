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
      <div className="card w-full max-w-md p-8 shadow-sm">{children}</div>
    </div>
  );
}
