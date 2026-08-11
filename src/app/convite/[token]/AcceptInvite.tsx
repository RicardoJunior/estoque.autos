"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { acceptInviteAction, type AcceptState } from "./actions";

/** Botão "Aceitar convite" com estado de erro inline (usuário logado). */
export function AcceptInvite({ token }: { token: string }) {
  const [state, action] = useActionState<AcceptState, FormData>(
    acceptInviteAction,
    {},
  );

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="token" value={token} />
      {state.error && (
        <div className="rounded-lg bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
          {state.error}
        </div>
      )}
      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Entrando na equipe…" : "Aceitar convite"}
    </Button>
  );
}
