import type { Metadata } from "next";
import Link from "next/link";
import { ContentShell } from "../blog/_shell";
import { PLANS, formatPlanPrice } from "@/lib/billing";

export const metadata: Metadata = {
  title: "Termos de Uso",
  description:
    "Termos de Uso do estoque.autos: objeto do serviço, conta e responsabilidades do lojista, planos e pagamento, cancelamento, conteúdo proibido e limitação de responsabilidade.",
  alternates: { canonical: "/termos" },
};

const ATUALIZACAO = "10 de agosto de 2026";

export default function TermosPage() {
  return (
    <ContentShell>
      <article className="ct-article">
        <div className="ct-article-wrap">
          <header className="ct-article-head">
            <span className="ct-article-cat">Legal</span>
          </header>

          <div className="ct-prose">
            <h1>Termos de Uso</h1>
            <p className="ct-article-meta">
              Última atualização: {ATUALIZACAO}
            </p>

            <p>
              Estes Termos de Uso regulam o acesso e a utilização da plataforma
              estoque.autos (&ldquo;Plataforma&rdquo;). Ao criar uma conta, você
              (&ldquo;Lojista&rdquo;) declara que leu, entendeu e concorda com
              estes Termos e com a nossa{" "}
              <Link href="/privacidade">Política de Privacidade</Link>. Se não
              concordar, não utilize o serviço.
            </p>

            <h2>1. Objeto do serviço</h2>
            <p>
              O estoque.autos é uma plataforma de criação de sites e vitrines
              online para revendas de veículos. O serviço inclui a publicação de
              uma vitrine com os veículos cadastrados pelo Lojista, templates e
              personalização visual, cadastro de veículos com referência à
              tabela FIPE, captação de leads (formulário de proposta e botão de
              WhatsApp) e, conforme o plano, conexão de domínio próprio.
            </p>
            <p>
              A Plataforma é uma ferramenta de divulgação.{" "}
              <strong>
                Não intermediamos, garantimos nem participamos das negociações
              </strong>{" "}
              entre o Lojista e os interessados nos veículos anunciados.
            </p>

            <h2>2. Conta e cadastro</h2>
            <ul>
              <li>
                Para usar a Plataforma é preciso criar uma conta com nome,
                e-mail válido e senha, e assinar um dos planos.
              </li>
              <li>
                As informações fornecidas no cadastro devem ser verdadeiras,
                completas e atualizadas.
              </li>
              <li>
                A conta é pessoal e intransferível. O Lojista é responsável por
                manter a confidencialidade da senha e por toda atividade
                realizada na sua conta.
              </li>
              <li>
                O serviço destina-se a pessoas jurídicas e profissionais do
                comércio de veículos, maiores de 18 anos.
              </li>
            </ul>

            <h2>3. Responsabilidades do Lojista</h2>
            <p>
              Todo o conteúdo publicado na vitrine — anúncios, preços, fotos,
              descrições e dados da loja — é de responsabilidade exclusiva do
              Lojista. Ao publicar, o Lojista declara e garante que:
            </p>
            <ul>
              <li>
                As informações dos anúncios são <strong>verdadeiras</strong>:
                preço, ano, quilometragem, estado de conservação e demais
                características correspondem ao veículo real ofertado.
              </li>
              <li>
                Possui a propriedade ou autorização para anunciar os veículos, e
                que eles têm origem lícita e situação regular.
              </li>
              <li>
                Detém os <strong>direitos sobre as fotos, logotipo e marcas</strong>{" "}
                enviados à Plataforma, ou tem autorização dos titulares para
                usá-los.
              </li>
              <li>
                Cumpre a legislação aplicável às suas ofertas e vendas,
                incluindo o Código de Defesa do Consumidor.
              </li>
            </ul>
            <p>
              O Lojista concede à Plataforma uma licença não exclusiva para
              hospedar e exibir esse conteúdo, exclusivamente para a prestação
              do serviço. O conteúdo continua sendo do Lojista.
            </p>

            <h2>4. Planos, pagamento e cancelamento</h2>
            <ul>
              <li>
                A Plataforma oferece os planos <strong>Básico</strong> (
                {formatPlanPrice(PLANS.basico, "mensal")} ou{" "}
                {formatPlanPrice(PLANS.basico, "anual")}) e{" "}
                <strong>Pro</strong> ({formatPlanPrice(PLANS.pro, "mensal")} ou{" "}
                {formatPlanPrice(PLANS.pro, "anual")}), com cobrança recorrente
                mensal ou anual. Os valores vigentes são sempre os exibidos na
                página de planos no momento da contratação.
              </li>
              <li>
                Os pagamentos são processados pela <strong>Stripe</strong>. Não
                armazenamos os dados completos do seu cartão.
              </li>
              <li>
                Você pode <strong>cancelar quando quiser</strong>, sem multa,
                em <strong>Configurações → Assinatura</strong> no painel. Ao
                cancelar, a vitrine permanece no ar até o fim do período já
                pago; depois disso ela deixa de ficar pública e os dados da
                loja ficam guardados para eventual reativação.
              </li>
              <li>
                Na primeira contratação, aplica-se o direito de arrependimento
                em até 7 dias, nos termos do art. 49 do Código de Defesa do
                Consumidor, com reembolso integral.
              </li>
              <li>
                Alterações de preço serão comunicadas com antecedência e valem
                a partir do ciclo de cobrança seguinte.
              </li>
            </ul>

            <h2>5. Conteúdo proibido</h2>
            <p>É vedado usar a Plataforma para publicar ou transmitir:</p>
            <ul>
              <li>
                Anúncios de veículos de origem ilícita, adulterados ou com
                informações falsas ou enganosas;
              </li>
              <li>
                Conteúdo que viole direitos de terceiros (autorais, de imagem,
                de marca) ou a legislação vigente;
              </li>
              <li>
                Conteúdo discriminatório, ofensivo, difamatório ou de qualquer
                forma ilegal;
              </li>
              <li>
                Malware, spam ou qualquer mecanismo que prejudique a segurança
                ou o funcionamento da Plataforma;
              </li>
              <li>Anúncios de produtos ou serviços alheios ao comércio de veículos.</li>
            </ul>
            <p>
              A Plataforma pode remover conteúdo e suspender ou encerrar contas
              que violem estes Termos, mediante aviso quando possível.
            </p>

            <h2>6. Disponibilidade do serviço</h2>
            <p>
              O serviço é fornecido &ldquo;no estado em que se encontra&rdquo;
              (&ldquo;as is&rdquo;). Empregamos esforços razoáveis para manter a
              Plataforma disponível e segura, mas não garantimos operação
              ininterrupta ou livre de erros. Manutenções programadas e eventos
              fora do nosso controle (falhas de provedores, força maior) podem
              causar indisponibilidade temporária.
            </p>

            <h2>7. Limitação de responsabilidade</h2>
            <ul>
              <li>
                A Plataforma não é parte nas negociações entre o Lojista e os
                compradores e não responde pelos veículos anunciados, pela
                veracidade dos anúncios nem por obrigações assumidas pelo
                Lojista com terceiros.
              </li>
              <li>
                Na máxima extensão permitida pela lei, a responsabilidade total
                da Plataforma por danos decorrentes do uso do serviço fica
                limitada ao valor pago pelo Lojista nos 12 meses anteriores ao
                evento.
              </li>
              <li>
                A Plataforma não responde por lucros cessantes ou danos
                indiretos, salvo nas hipóteses em que a lei não admita essa
                limitação.
              </li>
            </ul>

            <h2>8. Alterações destes Termos</h2>
            <p>
              Podemos atualizar estes Termos para refletir mudanças no serviço
              ou na legislação. Alterações relevantes serão comunicadas por
              e-mail ou aviso no painel com antecedência razoável. O uso
              continuado do serviço após a vigência das alterações significa
              concordância com a nova versão.
            </p>

            <h2>9. Legislação e foro</h2>
            <p>
              Estes Termos são regidos pelas leis da República Federativa do
              Brasil. Fica eleito o foro do domicílio do Lojista quando
              aplicável a legislação consumerista e, nos demais casos, o foro da
              comarca de São Paulo/SP, para dirimir quaisquer controvérsias.
            </p>

            <h2>10. Contato</h2>
            <p>
              Dúvidas sobre estes Termos? Fale com a gente em{" "}
              <a href="mailto:contato@estoque.autos">contato@estoque.autos</a>{" "}
              ou consulte a <Link href="/ajuda">Central de ajuda</Link>.
            </p>
          </div>
        </div>
      </article>
    </ContentShell>
  );
}
