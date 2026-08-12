"use client";

import { useState } from "react";
import {
  EditorContent,
  Extension,
  useEditor,
  type Editor,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  CornerDownLeft,
  Italic,
  Link2,
  Link2Off,
  List,
  ListOrdered,
  Underline,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";

/**
 * Variante inline (título/subtítulo do hero): bloco único — Enter vira
 * quebra de linha em vez de novo parágrafo.
 */
const SingleBlock = Extension.create({
  name: "singleBlock",
  addKeyboardShortcuts() {
    return {
      Enter: () => this.editor.commands.setHardBreak(),
    };
  },
});

/** Remove o <p> envoltório do editor de bloco único (vai dentro de h1/p). */
function stripParagraph(html: string): string {
  return html
    .replace(/<\/p>\s*<p[^>]*>/g, "<br>")
    .replace(/^<p[^>]*>/, "")
    .replace(/<\/p>$/, "");
}

/**
 * Editor rich text enxuto para textos da loja. Emite HTML — o server
 * SEMPRE sanitiza com a allowlist de src/lib/rich-text antes de salvar.
 * - variant "block" (default): parágrafos, listas e links (Sobre a loja)
 * - variant "inline": só ênfase + quebra de linha (título/subtítulo)
 */
export function RichTextEditor({
  value,
  onChange,
  placeholder,
  className,
  variant = "block",
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  variant?: "block" | "inline";
}) {
  const inline = variant === "inline";
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // só o que a allowlist do sanitizador aceita
        heading: false,
        blockquote: false,
        code: false,
        codeBlock: false,
        horizontalRule: false,
        ...(inline
          ? {
              bulletList: false,
              orderedList: false,
              listItem: false,
              link: false,
            }
          : {
              link: {
                openOnClick: false,
                defaultProtocol: "https",
                protocols: ["http", "https", "mailto", "tel"],
              },
            }),
      }),
      ...(inline ? [SingleBlock] : []),
    ],
    content: value,
    // Next (SSR): renderiza só no client, sem mismatch de hidratação
    immediatelyRender: false,
    // toolbar reflete a seleção atual (negrito ativo etc.)
    shouldRerenderOnTransaction: true,
    editorProps: {
      attributes: {
        class: cn(
          inline
            ? "min-h-9 px-3 py-2 text-sm leading-relaxed outline-none"
            : "min-h-28 px-3 py-2 text-sm leading-relaxed outline-none",
          "[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2",
          "[&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5",
          "[&_p:not(:first-child)]:mt-2",
        ),
        "aria-label": placeholder ?? "Editor de texto",
      },
    },
    onUpdate: ({ editor: e }) =>
      onChange(
        e.isEmpty ? "" : inline ? stripParagraph(e.getHTML()) : e.getHTML(),
      ),
  });

  return (
    <div
      className={cn(
        "rounded-lg border border-input bg-background transition-shadow focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-0.5 border-b border-border px-1.5 py-1">
        <MarkButton
          editor={editor}
          mark="bold"
          label="Negrito"
          onClick={() => editor?.chain().focus().toggleBold().run()}
        >
          <Bold />
        </MarkButton>
        <MarkButton
          editor={editor}
          mark="italic"
          label="Itálico"
          onClick={() => editor?.chain().focus().toggleItalic().run()}
        >
          <Italic />
        </MarkButton>
        <MarkButton
          editor={editor}
          mark="underline"
          label="Sublinhado"
          onClick={() => editor?.chain().focus().toggleUnderline().run()}
        >
          <Underline />
        </MarkButton>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Quebra de linha"
          title="Quebra de linha (Shift+Enter)"
          onClick={() => editor?.chain().focus().setHardBreak().run()}
        >
          <CornerDownLeft />
        </Button>
        {!inline && (
          <>
            <Separator orientation="vertical" className="mx-1 h-5" />
            <MarkButton
              editor={editor}
              mark="bulletList"
              label="Lista"
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
            >
              <List />
            </MarkButton>
            <MarkButton
              editor={editor}
              mark="orderedList"
              label="Lista numerada"
              onClick={() => editor?.chain().focus().toggleOrderedList().run()}
            >
              <ListOrdered />
            </MarkButton>
            <Separator orientation="vertical" className="mx-1 h-5" />
            <LinkButton editor={editor} />
          </>
        )}
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}

function MarkButton({
  editor,
  mark,
  label,
  onClick,
  children,
}: {
  editor: Editor | null;
  mark: string;
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const active = editor?.isActive(mark) ?? false;
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={label}
      aria-pressed={active}
      title={label}
      onClick={onClick}
      className={cn(active && "bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary")}
    >
      {children}
    </Button>
  );
}

function LinkButton({ editor }: { editor: Editor | null }) {
  const [open, setOpen] = useState(false);
  const [href, setHref] = useState("");
  const isLink = editor?.isActive("link") ?? false;

  function applyLink() {
    if (!editor) return;
    const url = href.trim();
    if (url) {
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: url })
        .run();
    }
    setOpen(false);
    setHref("");
  }

  if (isLink) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Remover link"
        title="Remover link"
        onClick={() => editor?.chain().focus().unsetLink().run()}
        className="text-primary hover:text-primary"
      >
        <Link2Off />
      </Button>
    );
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setHref(editor?.getAttributes("link").href ?? "");
      }}
    >
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Inserir link"
            title="Inserir link"
          />
        }
      >
        <Link2 />
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3">
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            applyLink();
          }}
        >
          <Input
            autoFocus
            value={href}
            onChange={(e) => setHref(e.target.value)}
            placeholder="https://exemplo.com.br"
            aria-label="Endereço do link"
          />
          <Button type="submit" size="sm">
            Aplicar
          </Button>
        </form>
      </PopoverContent>
    </Popover>
  );
}
