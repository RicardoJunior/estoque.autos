/**
 * Script para testar a conexão com o Webmotors
 *
 * Este script faz uma requisição simples para verificar se conseguimos
 * acessar a API do Webmotors e obter dados básicos.
 */

import axios from 'axios';
import { Logger } from '../utils/logger.js';

const logger = new Logger('test-connection');

async function testConnection() {
  logger.info('Testando conexão com Webmotors...\n');

  try {
    // Testar endpoint principal
    logger.info('1. Testando acesso ao site principal...');
    const mainResponse = await axios.get('https://www.webmotors.com.br', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
      timeout: 10000,
    });

    logger.success(`✓ Site acessível (status: ${mainResponse.status})`);

    // Testar API de marcas
    logger.info('\n2. Testando API de marcas/modelos...');
    const apiUrl = 'https://www.webmotors.com.br/api/Typeahead/MarcasModelos?tipo=Carros';

    const apiResponse = await axios.get(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        Accept: 'application/json',
        Referer: 'https://www.webmotors.com.br/',
      },
      timeout: 10000,
    });

    logger.success(`✓ API acessível (status: ${apiResponse.status})`);

    if (Array.isArray(apiResponse.data)) {
      logger.success(`✓ Formato correto: Array com ${apiResponse.data.length} itens`);

      if (apiResponse.data.length > 0) {
        logger.info('\nExemplo de dados retornados:');
        logger.info(JSON.stringify(apiResponse.data[0], null, 2));
      }
    } else {
      logger.warn('⚠ Formato inesperado na resposta da API');
      logger.info('Tipo de dados:', typeof apiResponse.data);
    }

    logger.info('\n========================================');
    logger.success('✓ Conexão testada com sucesso!');
    logger.info('O crawler deve funcionar corretamente.');
    logger.info('========================================');

  } catch (error) {
    logger.error('\n========================================');
    logger.error('✗ Erro ao testar conexão');
    logger.error('========================================');

    if (axios.isAxiosError(error)) {
      if (error.code === 'ENOTFOUND') {
        logger.error('Erro de DNS: Não foi possível resolver o domínio');
        logger.info('Verifique sua conexão com a internet');
      } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
        logger.error('Timeout: Requisição demorou muito para responder');
        logger.info('Tente novamente em alguns minutos');
      } else if (error.response) {
        logger.error(`HTTP ${error.response.status}: ${error.response.statusText}`);
        if (error.response.status === 403) {
          logger.info('Possível bloqueio por rate limiting ou firewall');
        } else if (error.response.status === 429) {
          logger.info('Rate limit atingido. Aguarde alguns minutos');
        }
      } else {
        logger.error(error.message);
      }
    } else {
      logger.error((error as Error).message);
    }

    process.exit(1);
  }
}

// Executar
testConnection();
