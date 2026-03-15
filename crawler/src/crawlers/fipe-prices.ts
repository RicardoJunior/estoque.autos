import axios from 'axios';
import pLimit from 'p-limit';
import { Logger } from '../utils/logger.js';
import { FileHandler } from '../utils/file-handler.js';
import { randomDelay } from '../utils/delay.js';
import type { Version, FipePrice, CrawlResult } from '../types/vehicle.js';

const logger = new Logger('fipe-prices');
const fileHandler = new FileHandler();

const FIPE_BASE_URL = 'https://parallelum.com.br/fipe/api/v1/carros';
const SAVE_INTERVAL = 1000;

/**
 * Buscar preço FIPE para uma versão específica (modelo + ano)
 */
async function crawlFipePriceForVersion(version: Version): Promise<FipePrice | null> {
  try {
    await randomDelay(200, 500);

    const url = `${FIPE_BASE_URL}/marcas/${version.brandId}/modelos/${version.modelId}/anos/${version.yearCode}`;

    const response = await axios.get(url, { timeout: 15000 });

    if (response.data && response.data.Valor) {
      const data = response.data;

      const fipePrice: FipePrice = {
        id: `${version.modelId}-${version.yearCode}`,
        codigoFipe: data.CodigoFipe || '',
        preco: data.Valor || '',
        marca: data.Marca || version.brandName,
        modelo: data.Modelo || version.modelName,
        anoModelo: data.AnoModelo || 0,
        combustivel: data.Combustivel || '',
        siglaCombustivel: data.SiglaCombustivel || '',
        mesReferencia: data.MesReferencia || '',
        modelId: version.modelId,
        modelName: version.modelName,
        brandId: version.brandId,
        brandName: version.brandName,
        yearCode: version.yearCode,
      };

      return fipePrice;
    }

    return null;
  } catch (error) {
    const err = error as Error;
    const status = axios.isAxiosError(error) ? ` (HTTP ${error.response?.status})` : '';
    logger.error(
      `Erro FIPE ${version.brandName} ${version.modelName} ${version.yearCode}${status}: ${err.message}`
    );
    return null;
  }
}

/**
 * Crawl de todos os preços FIPE
 * Suporta resumability: carrega dados existentes e pula itens já buscados
 */
export async function crawlFipePrices(): Promise<CrawlResult<FipePrice>> {
  logger.info('Iniciando crawl de preços FIPE...');

  const errors: string[] = [];

  try {
    // Carregar versões
    const versionsResult = fileHandler.load<CrawlResult<Version>>('versions.json');

    if (!versionsResult || !versionsResult.data || versionsResult.data.length === 0) {
      throw new Error(
        'Arquivo de versões não encontrado ou vazio. Execute crawl:versions primeiro.'
      );
    }

    const versions = versionsResult.data;
    logger.info(`${versions.length} versões carregadas`);

    // Resumability: carregar preços já buscados
    const existingResult = fileHandler.load<CrawlResult<FipePrice>>('fipe-prices.json');
    const existingPrices: FipePrice[] = existingResult?.data || [];
    const existingKeys = new Set(existingPrices.map((p) => p.id));

    const pendingVersions = versions.filter((v) => !existingKeys.has(`${v.modelId}-${v.yearCode}`));

    if (pendingVersions.length === 0) {
      logger.success('Todos os preços FIPE já foram buscados!');
      return {
        success: true,
        data: existingPrices,
        errors: [],
        timestamp: new Date().toISOString(),
        totalItems: existingPrices.length,
      };
    }

    logger.info(
      `${existingPrices.length} preços já existentes, ${pendingVersions.length} pendentes`
    );

    const prices: FipePrice[] = [...existingPrices];
    const limit = pLimit(3);
    let processed = 0;
    let newItems = 0;

    const promises = pendingVersions.map((version) =>
      limit(async () => {
        try {
          const price = await crawlFipePriceForVersion(version);

          if (price) {
            prices.push(price);
            newItems++;
          }

          processed++;
          logger.progress(
            processed,
            pendingVersions.length,
            `${version.brandName} ${version.modelName} ${version.yearCode}`
          );

          // Save progressivo
          if (newItems > 0 && newItems % SAVE_INTERVAL === 0) {
            const partial: CrawlResult<FipePrice> = {
              success: true,
              data: [...prices],
              errors: [...errors],
              timestamp: new Date().toISOString(),
              totalItems: prices.length,
            };
            fileHandler.save('fipe-prices.json', partial);
            logger.info(
              `[Checkpoint] Salvo ${prices.length} preços (${processed}/${pendingVersions.length} processados)`
            );
          }
        } catch (error) {
          const msg = `${version.brandName} ${version.modelName} ${version.yearCode}: ${(error as Error).message}`;
          errors.push(msg);
          processed++;
        }
      })
    );

    await Promise.all(promises);

    // Ordenar por marca, modelo, ano
    prices.sort((a, b) => {
      const brandCompare = a.brandName.localeCompare(b.brandName);
      if (brandCompare !== 0) return brandCompare;

      const modelCompare = a.modelName.localeCompare(b.modelName);
      if (modelCompare !== 0) return modelCompare;

      return b.anoModelo - a.anoModelo;
    });

    logger.success(`\nTotal de preços FIPE: ${prices.length} (${newItems} novos)`);

    if (errors.length > 0) {
      logger.warn(`${errors.length} erros durante o crawl`);
    }

    const result: CrawlResult<FipePrice> = {
      success: true,
      data: prices,
      errors,
      timestamp: new Date().toISOString(),
      totalItems: prices.length,
    };

    fileHandler.save('fipe-prices.json', result);
    logger.success('Dados salvos em data/fipe-prices.json');

    return result;
  } catch (error) {
    const err = error as Error;
    logger.error('Erro ao fazer crawl de preços FIPE', err);
    errors.push(err.message);

    return {
      success: false,
      data: [],
      errors,
      timestamp: new Date().toISOString(),
      totalItems: 0,
    };
  }
}

// Executar se for chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  crawlFipePrices()
    .then((result) => {
      if (result.success) {
        logger.success('Crawl de preços FIPE concluído com sucesso!');
        process.exit(0);
      } else {
        logger.error('Crawl de preços FIPE falhou');
        process.exit(1);
      }
    })
    .catch((error) => {
      logger.error('Erro fatal', error);
      process.exit(1);
    });
}
