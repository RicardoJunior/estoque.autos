import type { MDXComponents } from "mdx/types";
import Link from "next/link";
import type { AnchorHTMLAttributes } from "react";

/**
 * Componentes globais do MDX (blog + ajuda). O `@next/mdx` exige este arquivo.
 * A tipografia é feita pelo wrapper `.prose` no layout das rotas — aqui só
 * trocamos links internos por <Link> (navegação client-side) e deixamos os
 * âncoras (rehype-slug) com rolagem suave/offset via classe.
 */
const components: MDXComponents = {
  a: ({ href, children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) => {
    if (href?.startsWith("/")) {
      return (
        <Link href={href} {...props}>
          {children}
        </Link>
      );
    }
    const external = href?.startsWith("http");
    return (
      <a
        href={href}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        {...props}
      >
        {children}
      </a>
    );
  },
};

export function useMDXComponents(): MDXComponents {
  return components;
}
