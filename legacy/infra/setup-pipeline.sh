#!/bin/bash
###############################################################################
# setup-pipeline.sh - Criar CodePipeline + CodeBuild na AWS
#
# Pipeline:
#   GitHub (push) -> CodeBuild (build) -> S3/CloudFront (frontend)
#                                      -> CodeDeploy/EC2 (backend)
#
# Custo:
#   CodePipeline:  $1/mes por pipeline ativo
#   CodeBuild:     $0.005/min (build ARM small) - ~$0.50/mes com 100 builds de 1min
#   CodeDeploy:    GRATIS para EC2
#   TOTAL CI/CD:   ~$1.50/mes
#
# Pre-requisitos:
#   1. Infraestrutura ja criada (./deploy.sh)
#   2. CodeStar Connection com GitHub criada no Console AWS:
#      Console > Developer Tools > Settings > Connections > Create connection
#      Selecione GitHub, autorize, e copie o ARN.
#
# Uso:
#   chmod +x setup-pipeline.sh
#   ./setup-pipeline.sh
###############################################################################
set -euo pipefail

# ============================================================
# Configuracoes
# ============================================================
PROJECT_NAME="estoque-autos"
AWS_REGION="${AWS_REGION:-us-east-1}"
INFRA_STACK_NAME="${PROJECT_NAME}-infra"
PIPELINE_STACK_NAME="${PROJECT_NAME}-pipeline"

# ============================================================
# Cores
# ============================================================
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

info()  { echo -e "${BLUE}[INFO]${NC} $1"; }
ok()    { echo -e "${GREEN}[OK]${NC} $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERRO]${NC} $1"; exit 1; }

# ============================================================
# Verificar pre-requisitos
# ============================================================
info "Verificando pre-requisitos..."

command -v aws >/dev/null 2>&1 || error "AWS CLI nao encontrado"
aws sts get-caller-identity >/dev/null 2>&1 || error "AWS CLI nao configurado"

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ok "AWS Account: ${ACCOUNT_ID}"

# Verificar se stack de infra existe
aws cloudformation describe-stacks --stack-name "${INFRA_STACK_NAME}" --region "${AWS_REGION}" >/dev/null 2>&1 || \
    error "Stack de infraestrutura '${INFRA_STACK_NAME}' nao encontrada. Execute ./deploy.sh primeiro."

# ============================================================
# Coletar outputs da infra
# ============================================================
info "Coletando dados da infraestrutura existente..."

get_output() {
    aws cloudformation describe-stacks --stack-name "${INFRA_STACK_NAME}" --region "${AWS_REGION}" \
        --query "Stacks[0].Outputs[?OutputKey=='$1'].OutputValue" --output text
}

FRONTEND_BUCKET=$(get_output "FrontendBucketName")
CLOUDFRONT_ID=$(get_output "CloudFrontDistributionId")
BACKEND_INSTANCE_ID=$(get_output "BackendInstanceId")

ok "Frontend Bucket: ${FRONTEND_BUCKET}"
ok "CloudFront ID: ${CLOUDFRONT_ID}"
ok "Backend Instance: ${BACKEND_INSTANCE_ID}"

# ============================================================
# Coletar parametros do pipeline
# ============================================================
echo ""
echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}  Configuracao do Pipeline CI/CD${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""

# GitHub
read -p "GitHub Owner (usuario ou org): " GITHUB_OWNER
[ -z "$GITHUB_OWNER" ] && error "GitHub Owner e obrigatorio"

read -p "GitHub Repo name: " GITHUB_REPO
[ -z "$GITHUB_REPO" ] && error "GitHub Repo e obrigatorio"

read -p "Branch principal [main]: " GITHUB_BRANCH
GITHUB_BRANCH="${GITHUB_BRANCH:-main}"

# CodeStar Connection
echo ""
info "Conexoes CodeStar disponiveis:"
aws codestar-connections list-connections --region "${AWS_REGION}" \
    --query "Connections[?ProviderType=='GitHub'].{Name:ConnectionName,ARN:ConnectionArn,Status:ConnectionStatus}" \
    --output table 2>/dev/null || warn "Nenhuma conexao encontrada"

echo ""
echo -e "${YELLOW}Se nao ha conexao, crie uma em:${NC}"
echo -e "  Console AWS > Developer Tools > Settings > Connections > Create connection"
echo -e "  Selecione GitHub, autorize, e copie o ARN."
echo ""
read -p "ARN da CodeStar Connection: " GITHUB_CONNECTION_ARN
[ -z "$GITHUB_CONNECTION_ARN" ] && error "Connection ARN e obrigatorio"

# Validar que a conexao esta AVAILABLE
CONNECTION_STATUS=$(aws codestar-connections get-connection --connection-arn "${GITHUB_CONNECTION_ARN}" \
    --region "${AWS_REGION}" --query "Connection.ConnectionStatus" --output text 2>/dev/null || echo "UNKNOWN")

if [ "$CONNECTION_STATUS" != "AVAILABLE" ]; then
    warn "Conexao nao esta AVAILABLE (status: ${CONNECTION_STATUS})"
    warn "A conexao precisa ser ativada no Console AWS antes do pipeline funcionar."
    read -p "Continuar mesmo assim? (s/n): " CONTINUE
    [[ ! "$CONTINUE" =~ ^[sS]$ ]] && exit 0
fi

# ============================================================
# Deploy CloudFormation - Pipeline
# ============================================================
echo ""
info "Criando pipeline via CloudFormation..."
info "Stack: ${PIPELINE_STACK_NAME}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

aws cloudformation deploy \
    --template-file "${SCRIPT_DIR}/cloudformation-pipeline.yaml" \
    --stack-name "${PIPELINE_STACK_NAME}" \
    --region "${AWS_REGION}" \
    --capabilities CAPABILITY_NAMED_IAM \
    --parameter-overrides \
        ProjectName="${PROJECT_NAME}" \
        GitHubOwner="${GITHUB_OWNER}" \
        GitHubRepo="${GITHUB_REPO}" \
        GitHubBranch="${GITHUB_BRANCH}" \
        GitHubConnectionArn="${GITHUB_CONNECTION_ARN}" \
        FrontendBucketName="${FRONTEND_BUCKET}" \
        CloudFrontDistributionId="${CLOUDFRONT_ID}" \
        BackendInstanceId="${BACKEND_INSTANCE_ID}" \
    --tags \
        Key=Project,Value="${PROJECT_NAME}" \
        Key=Environment,Value=production \
    --no-fail-on-empty-changeset

ok "Pipeline criado com sucesso!"

# ============================================================
# Coletar outputs do pipeline
# ============================================================
PIPELINE_URL=$(aws cloudformation describe-stacks --stack-name "${PIPELINE_STACK_NAME}" --region "${AWS_REGION}" \
    --query "Stacks[0].Outputs[?OutputKey=='PipelineURL'].OutputValue" --output text)

# ============================================================
# Resumo final
# ============================================================
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Pipeline CI/CD Criado!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "  ${BLUE}Pipeline Console:${NC}  ${PIPELINE_URL}"
echo -e "  ${BLUE}Repositorio:${NC}       ${GITHUB_OWNER}/${GITHUB_REPO}"
echo -e "  ${BLUE}Branch:${NC}            ${GITHUB_BRANCH}"
echo ""
echo -e "${YELLOW}Como funciona:${NC}"
echo -e "  1. Push para '${GITHUB_BRANCH}' dispara o pipeline automaticamente"
echo -e "  2. CodeBuild compila frontend e backend em paralelo (ARM, menor custo)"
echo -e "  3. Frontend e enviado para S3 + invalidacao CloudFront"
echo -e "  4. Backend e deployed via CodeDeploy para EC2"
echo ""
echo -e "${YELLOW}Custo adicional do CI/CD:${NC}"
echo -e "  CodePipeline:  \$1.00/mes (por pipeline ativo)"
echo -e "  CodeBuild:     ~\$0.50/mes (100 builds de 1 min cada)"
echo -e "  CodeDeploy:    \$0.00 (gratis para EC2)"
echo -e "  ${GREEN}TOTAL CI/CD:   ~\$1.50/mes${NC}"
echo ""
echo -e "${YELLOW}Custo total estimado (infra + CI/CD):${NC}"
echo -e "  ${GREEN}~\$12.36/mes (ou ~\$6.24/mes no free tier)${NC}"
echo ""
echo -e "${YELLOW}Primeiro deploy:${NC}"
echo -e "  O pipeline sera disparado automaticamente no proximo push."
echo -e "  Ou dispare manualmente:"
echo -e "  aws codepipeline start-pipeline-execution --name ${PROJECT_NAME}-pipeline --region ${AWS_REGION}"
echo ""
