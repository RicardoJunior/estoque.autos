import type { Metadata } from "next";
import Link from "next/link";
import { ContentShell } from "../blog/_shell";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description:
    "Política de Privacidade do estoque.autos (LGPD): quais dados coletamos, papéis de controlador e operador nos leads, suboperadores, cookies e seus direitos como titular.",
  alternates: { canonical: "/privacidade" },
};

const ATUALIZACAO = "10 de agosto de 2026";

export default function PrivacidadePage() {
  return (
    <ContentShell>
      <article className="ct-article">
        <div className="ct-article-wrap">
          <header className="ct-article-head">
            <span className="ct-article-cat">Legal</span>
          </header>

          <div className="ct-prose">
            <h1>Política de Privacidade</h1>
            <p className="ct-article-meta">
              Última atualização: {ATUALIZACAO}
            </p>

            <p>
              Esta Política explica como o estoque.autos trata dados pessoais,
              em conformidade com a Lei Geral de Proteção de Dados (Lei
              13.709/2018 — LGPD). Ela vale para os lojistas que assinam a
              plataforma e esclarece os papéis de cada um no tratamento dos
              dados dos compradores captados nas vitrines.
            </p>

            <h2>1. Quem somos</h2>
            <p>
              O estoque.autos é uma plataforma de sites e vitrines online para
              revendas de veículos. Em relação aos dados dos{" "}
              <strong>lojistas</strong> (conta, cadastro, pagamento e uso da
              plataforma), o estoque.autos atua como{" "}
              <strong>controlador</strong> dos dados pessoais.
            </p>

            <h2>2. Dados que coletamos do lojista</h2>
            <ul>
              <li>
                <strong>Cadastro:</strong> nome, e-mail e senha (armazenada de
                forma criptografada).
              </li>
              <li>
                <strong>Pagamento:</strong> os dados de cartão são coletados e
                processados diretamente pela Stripe — não armazenamos o número
                completo do seu cartão. Guardamos o identificador da assinatura
                e o histórico de cobranças.
              </li>
              <li>
                <strong>Dados da loja:</strong> nome da loja, logotipo,
                telefone/WhatsApp, endereço e demais informações que você
                publica na vitrine.
              </li>
              <li>
                <strong>Registros de acesso:</strong> endereço IP, data e hora
                de requisições — usados para segurança, prevenção a fraudes e
                limitação de requisições (rate limit), e para cumprir o Marco
                Civil da Internet.
              </li>
            </ul>
            <p>
              Usamos esses dados para prestar o serviço contratado, processar a
              cobrança, enviar comunicações transacionais (confirmações, avisos
              de cobrança, notificações de leads) e manter a plataforma segura.
              As bases legais são a execução do contrato, o cumprimento de
              obrigação legal e o legítimo interesse na segurança do serviço.
            </p>

            <h2>3. Leads: quem é responsável pelos dados dos compradores</h2>
            <p>
              Quando um interessado envia uma proposta ou clica no WhatsApp na
              vitrine de uma loja, os dados dele (nome, telefone, e-mail,
              mensagem) são coletados <strong>em nome do lojista</strong>:
            </p>
            <ul>
              <li>
                O <strong>lojista é o controlador</strong> dos dados dos
                compradores captados no site dele — é ele quem decide como usar
                esses contatos e quem responde pelos direitos desses titulares.
              </li>
              <li>
                O <strong>estoque.autos atua como operador</strong>: armazena e
                disponibiliza os leads no painel do lojista, seguindo as
                instruções dele e esta Política, sem usar esses dados para fins
                próprios.
              </li>
            </ul>
            <p>
              Se você é comprador e quer exercer seus direitos sobre dados
              enviados a uma loja, contate diretamente a loja. Como operadora, a
              plataforma auxilia o lojista a atender essas solicitações.
            </p>

            <h2>4. Com quem compartilhamos dados (suboperadores)</h2>
            <p>
              Para funcionar, a plataforma utiliza provedores de infraestrutura
              que podem tratar dados pessoais em nosso nome:
            </p>
            <ul>
              <li>
                <strong>Supabase</strong> — banco de dados e autenticação;
              </li>
              <li>
                <strong>Stripe</strong> — processamento de pagamentos;
              </li>
              <li>
                <strong>Resend</strong> — envio de e-mails transacionais;
              </li>
              <li>
                <strong>Cloudflare</strong> — infraestrutura, hospedagem e rede
                de entrega de conteúdo.
              </li>
            </ul>
            <p>
              Esses provedores podem processar dados fora do Brasil; nesses
              casos, a transferência internacional é amparada por salvaguardas
              contratuais adequadas, conforme a LGPD. Não vendemos dados
              pessoais nem os compartilhamos para fins de publicidade.
            </p>
            <p>
              Dados também podem ser fornecidos a autoridades quando exigido por
              lei ou ordem judicial.
            </p>

            <h2>5. Cookies</h2>
            <p>
              Usamos apenas cookies <strong>estritamente funcionais</strong>,
              necessários para manter a sua sessão autenticada no painel. Não
              usamos cookies de publicidade nem de rastreamento de terceiros.
            </p>

            <h2>6. Retenção e exclusão</h2>
            <p>
              Mantemos os dados enquanto a conta existir. Após o cancelamento,
              os dados da loja ficam guardados para eventual reativação e pelo
              prazo necessário ao cumprimento de obrigações legais (por
              exemplo, registros fiscais e de acesso). Você pode solicitar a
              exclusão definitiva da conta e dos dados pelo canal abaixo,
              ressalvadas as retenções exigidas por lei.
            </p>

            <h2>7. Seus direitos (LGPD)</h2>
            <p>Como titular de dados, você pode solicitar a qualquer momento:</p>
            <ul>
              <li>Confirmação da existência de tratamento e acesso aos dados;</li>
              <li>Correção de dados incompletos, inexatos ou desatualizados;</li>
              <li>
                Anonimização, bloqueio ou eliminação de dados desnecessários ou
                tratados em desconformidade;
              </li>
              <li>Portabilidade dos dados;</li>
              <li>
                Informação sobre com quem compartilhamos seus dados;
              </li>
              <li>Revogação de consentimento, quando aplicável.</li>
            </ul>
            <p>
              Para exercer seus direitos, escreva para{" "}
              <a href="mailto:privacidade@estoque.autos">
                privacidade@estoque.autos
              </a>
              . Responderemos nos prazos da LGPD. Você também pode apresentar
              reclamação à Autoridade Nacional de Proteção de Dados (ANPD).
            </p>

            <h2>8. Segurança</h2>
            <p>
              Adotamos medidas técnicas e organizacionais para proteger os
              dados: criptografia em trânsito (HTTPS), senhas armazenadas com
              hash, controle de acesso por conta e registro de eventos de
              segurança. Nenhum sistema é infalível; em caso de incidente com
              risco relevante, comunicaremos os afetados e a ANPD conforme a
              lei.
            </p>

            <h2>9. Alterações desta Política</h2>
            <p>
              Podemos atualizar esta Política para refletir mudanças no serviço
              ou na legislação. Alterações relevantes serão comunicadas por
              e-mail ou aviso no painel. A data da última atualização aparece no
              topo desta página.
            </p>

            <p>
              Veja também os nossos <Link href="/termos">Termos de Uso</Link>.
            </p>
          </div>
        </div>
      </article>
    </ContentShell>
  );
}
