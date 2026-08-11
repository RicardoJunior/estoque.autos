import { redirect } from "next/navigation";

/** /demo sem template (URL editada à mão) → primeira demonstração. */
export default function DemoIndexPage() {
  redirect("/demo/classico");
}
