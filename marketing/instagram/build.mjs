/**
 * Gera os carrosséis de Instagram do @estoque.autos.
 *
 *   node marketing/instagram/build.mjs                 # tudo
 *   node marketing/instagram/build.mjs lancamento      # só os 3 de lançamento
 *   node marketing/instagram/build.mjs blog            # os 35 do blog
 *   node marketing/instagram/build.mjs blog fipe giro  # só as pastas que casam
 *
 * Cada pasta recebe `slide-N.html` (fonte), `slide-N.png` (1080×1350) e
 * `legenda.md`. Renderização por Chrome headless — precisa de rede na primeira
 * vez, porque Anton e Archivo vêm do Google Fonts.
 */
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildPost } from './lib/render.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const [grupoArg, ...filtros] = process.argv.slice(2)

const GRUPOS = {
  lancamento: './lancamento/posts.mjs',
  blog: './blog/posts.mjs',
}

const grupos = grupoArg ? [grupoArg] : Object.keys(GRUPOS)
for (const g of grupos) {
  if (!GRUPOS[g]) {
    console.error(`grupo desconhecido: ${g} (use ${Object.keys(GRUPOS).join(' ou ')})`)
    process.exit(1)
  }
  const { POSTS } = await import(GRUPOS[g])
  const alvo = filtros.length ? POSTS.filter((p) => filtros.some((f) => p.dir.includes(f))) : POSTS
  if (!alvo.length) console.warn(`  ⚠ nenhum post de "${g}" casou com o filtro`)
  for (const post of alvo) {
    buildPost(join(HERE, g, post.dir), post)
    console.log(`  ✓ ${g}/${post.dir} — ${post.slides.length} slides + legenda`)
  }
}
