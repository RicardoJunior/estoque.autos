import { CircleAlert, CircleCheck, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const VARIANTS = {
  success: { icon: CircleCheck, className: "bg-primary/10 text-primary" },
  error: { icon: CircleAlert, className: "bg-destructive/10 text-destructive" },
  neutral: { icon: Info, className: "bg-muted text-muted-foreground" },
} as const;

/** Feedback de formulário (salvou / deu erro) no padrão visual do painel. */
export function FormBanner({
  variant,
  className,
  children,
}: {
  variant: keyof typeof VARIANTS;
  className?: string;
  children: React.ReactNode;
}) {
  const { icon: Icon, className: variantClass } = VARIANTS[variant];
  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2 rounded-lg px-3.5 py-2.5 text-sm",
        variantClass,
        className,
      )}
    >
      <Icon aria-hidden className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
