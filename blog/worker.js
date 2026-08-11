// Worker mínimo do blog: serve os assets estáticos do Astro (dist/ aninhado
// em .cloudflare/assets/blog para casar com a rota estoque.autos/blog*).
export default {
  fetch(request, env) {
    return env.ASSETS.fetch(request);
  },
};
