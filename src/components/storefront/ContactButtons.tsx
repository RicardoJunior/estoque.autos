"use client";

import { logClickLeadAction } from "@/app/[slug]/lead-actions";
import { whatsappLink } from "@/lib/format";

const WhatsAppIcon = (
  <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden>
    <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51l-.57-.01c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.22 3.08.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35zM12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 004.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2z" />
  </svg>
);

const PhoneIcon = (
  <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden>
    <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.24.2 2.45.57 3.57a1 1 0 01-.24 1.02l-2.21 2.2z" />
  </svg>
);

export function WhatsAppButton({
  vehicleId,
  phone,
  message,
  className,
  style,
  children,
}: {
  vehicleId: string;
  phone: string;
  message: string;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}) {
  function onClick() {
    // registra o lead sem bloquear a navegação para o WhatsApp
    void logClickLeadAction(vehicleId, "whatsapp");
    window.open(whatsappLink(phone, message), "_blank", "noopener");
  }
  return (
    <button type="button" onClick={onClick} className={className} style={style}>
      {WhatsAppIcon}
      {children ?? "WhatsApp"}
    </button>
  );
}

export function PhoneButton({
  vehicleId,
  phone,
  className,
  style,
  children,
}: {
  vehicleId: string;
  phone: string;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}) {
  function onClick() {
    void logClickLeadAction(vehicleId, "phone");
    window.location.href = `tel:${phone.replace(/\D/g, "")}`;
  }
  return (
    <button type="button" onClick={onClick} className={className} style={style}>
      {PhoneIcon}
      {children ?? "Ligar"}
    </button>
  );
}
