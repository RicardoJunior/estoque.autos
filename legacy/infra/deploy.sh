#!/bin/bash
###############################################################################
# deploy.sh - Subir infraestrutura Estoque.autos na AWS (menor custo)
#
# Arquitetura:
#   Frontend: S3 + CloudFront (~$0.50/mes com pouco trafego)
#   Backend:  EC2 t4g.micro + nginx + PM2 (~$6/mes, free tier 1 ano)
#   Secrets:  SSM Parameter Store (gratis)
#   DB:       Supabase (externo, sem custo AWS)
#
# Custo estimado: ~$7-10/mes (ou ~$1/mes no free tier)
#
# Pre-requisitos:
#   - AWS CLI v2 instalado e configurado (aws configure)
#   - Key Pair EC2 criado na regiao desejada
#
# Uso:
#   chmod +x deploy.sh
#   ./deploy.sh
###############################################################################
set -euo pipefail

# ============================================================
# Configuracoes - EDITE AQUI
# ============================================================
PROJECT_NAME="estoque-autos"
AWS_REGION="${AWS_REGION:-us-east-1}"        # us-east-1 = CloudFront mais barato
STACK_NAME="${PROJECT_NAME}-infra"

# ============================================================
# Cores para output
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

command -v aws >/dev/null 2>&1 || error "AWS CLI nao encontrado. Instale: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"

# Verificar credenciais
aws sts get-caller-identity >/dev/null 2>&1 || error "AWS CLI nao configurado. Execute: aws configure"

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ok "AWS Account: ${ACCOUNT_ID}"
ok "Regiao: ${AWS_REGION}"

# ============================================================
# Coletar parametros
# ============================================================
echo ""
echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}  Configuracao da Infraestrutura${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""

# Key Pair
info "Key Pairs disponiveis na regiao ${AWS_REGION}:"
aws ec2 describe-key-pairs --region "${AWS_REGION}" --query 'KeyPairs[].KeyName' --output table 2>/dev/null || true
echo ""
read -p "Nome do Key Pair para SSH: " KEY_PAIR_NAME
[ -z "$KEY_PAIR_NAME" ] && error "Key Pair e obrigatorio"

# Verificar se key pair existe
aws ec2 describe-key-pairs --key-names "${KEY_PAIR_NAME}" --region "${AWS_REGION}" >/dev/null 2>&1 || {
    warn "Key Pair '${KEY_PAIR_NAME}' nao encontrado."
    read -p "Criar novo Key Pair? (s/n): " CREATE_KP
    if [[ "$CREATE_KP" =~ ^[sS]$ ]]; then
        aws ec2 create-key-pair --key-name "${KEY_PAIR_NAME}" --region "${AWS_REGION}" \
            --query 'KeyMaterial' --output text > "${KEY_PAIR_NAME}.pem"
        chmod 400 "${KEY_PAIR_NAME}.pem"
        ok "Key Pair criado! Chave salva em: ${KEY_PAIR_NAME}.pem (GUARDE EM LOCAL SEGURO)"
    else
        error "Key Pair necessario para continuar"
    fi
}

# SSH IP
read -p "Seu IP para SSH (Enter para 0.0.0.0/0): " SSH_IP
SSH_IP="${SSH_IP:-0.0.0.0/0}"
[[ "$SSH_IP" != *"/"* ]] && SSH_IP="${SSH_IP}/32"

# Supabase
echo ""
info "Configuracao do Supabase:"
read -p "Supabase URL: " SUPABASE_URL
[ -z "$SUPABASE_URL" ] && error "Supabase URL e obrigatoria"

read -p "Supabase Anon Key: " SUPABASE_ANON_KEY
[ -z "$SUPABASE_ANON_KEY" ] && error "Supabase Anon Key e obrigatoria"

read -sp "Supabase Service Role Key: " SUPABASE_SERVICE_KEY
echo ""
[ -z "$SUPABASE_SERVICE_KEY" ] && error "Supabase Service Role Key e obrigatoria"

# Dominio (opcional)
read -p "Dominio customizado (Enter para pular): " DOMAIN_NAME

# ============================================================
# Deploy CloudFormation
# ============================================================
echo ""
info "Criando infraestrutura via CloudFormation..."
info "Stack: ${STACK_NAME}"
info "Isso pode levar 5-10 minutos..."
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

aws cloudformation deploy \
    --template-file "${SCRIPT_DIR}/cloudformation-infra.yaml" \
    --stack-name "${STACK_NAME}" \
    --region "${AWS_REGION}" \
    --capabilities CAPABILITY_NAMED_IAM \
    --parameter-overrides \
        ProjectName="${PROJECT_NAME}" \
        KeyPairName="${KEY_PAIR_NAME}" \
        SSHAllowedIP="${SSH_IP}" \
        SupabaseUrl="${SUPABASE_URL}" \
        SupabaseAnonKey="${SUPABASE_ANON_KEY}" \
        SupabaseServiceRoleKey="${SUPABASE_SERVICE_KEY}" \
        DomainName="${DOMAIN_NAME}" \
    --tags \
        Key=Project,Value="${PROJECT_NAME}" \
        Key=Environment,Value=production \
    --no-fail-on-empty-changeset

ok "CloudFormation deploy concluido!"

# ============================================================
# Coletar outputs
# ============================================================
info "Coletando informacoes da infraestrutura..."

FRONTEND_BUCKET=$(aws cloudformation describe-stacks --stack-name "${STACK_NAME}" --region "${AWS_REGION}" \
    --query "Stacks[0].Outputs[?OutputKey=='FrontendBucketName'].OutputValue" --output text)

CLOUDFRONT_DOMAIN=$(aws cloudformation describe-stacks --stack-name "${STACK_NAME}" --region "${AWS_REGION}" \
    --query "Stacks[0].Outputs[?OutputKey=='CloudFrontDomainName'].OutputValue" --output text)

CLOUDFRONT_ID=$(aws cloudformation describe-stacks --stack-name "${STACK_NAME}" --region "${AWS_REGION}" \
    --query "Stacks[0].Outputs[?OutputKey=='CloudFrontDistributionId'].OutputValue" --output text)

BACKEND_IP=$(aws cloudformation describe-stacks --stack-name "${STACK_NAME}" --region "${AWS_REGION}" \
    --query "Stacks[0].Outputs[?OutputKey=='BackendPublicIP'].OutputValue" --output text)

BACKEND_INSTANCE_ID=$(aws cloudformation describe-stacks --stack-name "${STACK_NAME}" --region "${AWS_REGION}" \
    --query "Stacks[0].Outputs[?OutputKey=='BackendInstanceId'].OutputValue" --output text)

# ============================================================
# Deploy inicial do frontend (build + upload)
# ============================================================
echo ""
read -p "Fazer deploy inicial do frontend agora? (s/n): " DEPLOY_FE
if [[ "$DEPLOY_FE" =~ ^[sS]$ ]]; then
    info "Building frontend..."
    cd "${SCRIPT_DIR}/../frontend"

    # Criar .env.production
    cat > .env.production << EOF
VITE_SUPABASE_URL=${SUPABASE_URL}
VITE_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
VITE_API_URL=http://${BACKEND_IP}
VITE_ENV=production
EOF

    npm ci
    npm run build

    info "Uploading para S3..."
    aws s3 sync dist/ "s3://${FRONTEND_BUCKET}/" --delete \
        --cache-control "public, max-age=31536000, immutable" \
        --exclude "index.html" --exclude "*.json" \
        --region "${AWS_REGION}"

    aws s3 cp dist/index.html "s3://${FRONTEND_BUCKET}/index.html" \
        --cache-control "public, max-age=0, must-revalidate" \
        --region "${AWS_REGION}"

    # Invalidar CloudFront
    aws cloudfront create-invalidation \
        --distribution-id "${CLOUDFRONT_ID}" \
        --paths "/index.html" \
        --region "${AWS_REGION}" >/dev/null

    ok "Frontend deployed!"
    rm -f .env.production
fi

# ============================================================
# Deploy inicial do backend
# ============================================================
echo ""
read -p "Fazer deploy inicial do backend agora? (s/n): " DEPLOY_BE
if [[ "$DEPLOY_BE" =~ ^[sS]$ ]]; then
    info "Building backend..."
    cd "${SCRIPT_DIR}/../backend"
    npm ci
    npm run build
    # Reinstalar apenas producao para o pacote de deploy
    npm ci --omit=dev

    info "Uploading para EC2..."
    # Criar pacote
    DEPLOY_DIR="/tmp/estoque-deploy"
    rm -rf "${DEPLOY_DIR}"
    mkdir -p "${DEPLOY_DIR}"
    cp -r dist/ "${DEPLOY_DIR}/"
    cp package.json package-lock.json "${DEPLOY_DIR}/"
    cp -r node_modules/ "${DEPLOY_DIR}/node_modules/"

    # Upload via SCP
    if [ -f "${SCRIPT_DIR}/${KEY_PAIR_NAME}.pem" ]; then
        PEM_FILE="${SCRIPT_DIR}/${KEY_PAIR_NAME}.pem"
    else
        read -p "Caminho do arquivo .pem: " PEM_FILE
    fi

    info "Aguardando EC2 ficar pronta (pode levar 2-3 min)..."
    aws ec2 wait instance-status-ok --instance-ids "${BACKEND_INSTANCE_ID}" --region "${AWS_REGION}" 2>/dev/null || {
        warn "Timeout esperando EC2. A instancia pode ainda estar inicializando."
        warn "Tente o deploy manual depois: scp -i ${PEM_FILE} ..."
    }

    scp -i "${PEM_FILE}" -o StrictHostKeyChecking=no -r "${DEPLOY_DIR}/" "ec2-user@${BACKEND_IP}:/home/ec2-user/app/backend/"

    # Iniciar aplicacao
    ssh -i "${PEM_FILE}" -o StrictHostKeyChecking=no "ec2-user@${BACKEND_IP}" << 'REMOTE'
    cd /home/ec2-user/app/backend
    source /home/ec2-user/app/load-env.sh
    cat > .env << ENVFILE
NODE_ENV=production
PORT=3000
SUPABASE_URL=${SUPABASE_URL}
SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
ALLOWED_ORIGINS=${ALLOWED_ORIGINS}
ENVFILE
    chmod 600 .env
    pm2 delete backend 2>/dev/null || true
    pm2 start dist/index.js --name backend --env production --max-memory-restart 512M
    pm2 save
REMOTE

    ok "Backend deployed!"
    rm -rf "${DEPLOY_DIR}"
fi

# ============================================================
# Resumo final
# ============================================================
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Deploy Concluido!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "  ${BLUE}Frontend URL:${NC}  https://${CLOUDFRONT_DOMAIN}"
echo -e "  ${BLUE}Backend URL:${NC}   http://${BACKEND_IP}"
echo -e "  ${BLUE}Backend SSH:${NC}   ssh -i ${KEY_PAIR_NAME}.pem ec2-user@${BACKEND_IP}"
echo ""
echo -e "  ${BLUE}S3 Bucket:${NC}     ${FRONTEND_BUCKET}"
echo -e "  ${BLUE}CloudFront ID:${NC} ${CLOUDFRONT_ID}"
echo -e "  ${BLUE}EC2 Instance:${NC}  ${BACKEND_INSTANCE_ID}"
echo ""
echo -e "${YELLOW}Custo estimado mensal:${NC}"
echo -e "  EC2 t4g.micro:    ~\$6.12/mes (GRATIS no free tier 1 ano)"
echo -e "  EBS 8GB gp3:      ~\$0.64/mes"
echo -e "  S3 + CloudFront:  ~\$0.50/mes (pouco trafego)"
echo -e "  Elastic IP (IPv4):\$3.60/mes (cobrado desde fev/2024)"
echo -e "  SSM Parameters:   \$0.00 (gratis Standard)"
echo -e "  ${GREEN}TOTAL:            ~\$10.86/mes (ou ~\$4.74/mes no free tier)${NC}"
echo ""
echo -e "${YELLOW}Proximo passo:${NC} Execute ./setup-pipeline.sh para configurar CI/CD"
echo ""
