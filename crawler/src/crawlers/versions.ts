import axios from 'axios';
import pLimit from 'p-limit';
import { Logger } from '../utils/logger.js';
import { FileHandler } from '../utils/file-handler.js';
import { randomDelay } from '../utils/delay.js';
import type { Model, Version, CrawlResult } from '../types/vehicle.js';

const logger = new Logger('versions');
const fileHandler = new FileHandler();

const FIPE_BASE_URL = 'https://parallelum.com.br/fipe/api/v1/carros';
const SAVE_INTERVAL = 500;

/**
 * Crawl de versões (anos) para um modelo específico usando API FIPE
 */
async function crawlVersionsForModel(model: Model): Promise<Version[]> {
  const versions: Version[] = [];

  try {
    await randomDelay(200, 500);

    const url = `${FIPE_BASE_URL}/marcas/${model.brandId}/modelos/${model.id}/anos`;

    const response = await axios.get(url, { timeout: 15000 });

    if (Array.isArray(response.data) && response.data.length > 0) {
      for (const yearData of response.data) {
        try {
          const yearCode = String(yearData.codigo);
          const name = String(yearData.nome);

          const version: Version = {
            id: `${model.id}-${yearCode}`,
            name,
            slug: name
              .toLowerCase()
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-|-$/g, ''),
            yearCode,
            modelId: model.id,
            modelName: model.name,
            brandId: model.brandId,
            brandName: model.brandName,
          };

          versions.push(version);
        } catch (error) {
          logger.error(
            `Erro ao processar ano de ${model.brandName} ${model.name}: ${(error as Error).message}`
          );
        }
      }
    }

    if (versions.length > 0) {
      logger.info(`${model.brandName} ${model.name}: ${versions.length} anos`);
    }

    return versions;
  } catch (error) {
    const err = error as Error;
    const status = axios.isAxiosError(error) ? ` (HTTP ${error.response?.status})` : '';
    logger.error(
      `Erro ao buscar anos de ${model.brandName} ${model.name}${status}: ${err.message}`
    );
    return [];
  }
}

/**
 * Crawl de todas as versões (anos) usando API FIPE
 */
export async function crawlVersions(): Promise<CrawlResult<Version>> {
  logger.info('Iniciando crawl de versões (anos) via API FIPE...');

  const versions: Version[] = [];
  const errors: string[] = [];

  try {
    const modelsResult = fileHandler.load<CrawlResult<Model>>('models.json');

    if (!modelsResult || !modelsResult.data) {
      throw new Error('Arquivo de modelos não encontrado. Execute crawl:models primeiro.');
    }

    const models = modelsResult.data;
    logger.info(`${models.length} modelos carregados`);

    const limit = pLimit(3);
    let processed = 0;

    const promises = models.map((model) =>
      limit(async () => {
        try {
          const modelVersions = await crawlVersionsForModel(model);
          versions.push(...modelVersions);
          processed++;

          logger.progress(processed, models.length, `${model.brandName} ${model.name}`);

          // Save progressivo para não perder dados
          if (processed % SAVE_INTERVAL === 0) {
            const partial: CrawlResult<Version> = {
              success: true,
              data: [...versions],
              errors: [...errors],
              timestamp: new Date().toISOString(),
              totalItems: versions.length,
            };
            fileHandler.save('versions.json', partial);
            logger.info(
              `[Checkpoint] Salvo ${versions.length} versões (${processed}/${models.length} modelos)`
            );
          }

          return modelVersions;
        } catch (error) {
          const msg = `${model.brandName} ${model.name}: ${(error as Error).message}`;
          errors.push(msg);
          logger.error(msg);
          processed++;
          return [];
        }
      })
    );

    await Promise.all(promises);

    // Ordenar versões
    versions.sort((a, b) => {
      const brandCompare = a.brandName.localeCompare(b.brandName);
      if (brandCompare !== 0) return brandCompare;

      const modelCompare = a.modelName.localeCompare(b.modelName);
      if (modelCompare !== 0) return modelCompare;

      return a.name.localeCompare(b.name);
    });

    logger.success(`\nTotal de versões coletadas: ${versions.length}`);

    if (errors.length > 0) {
      logger.warn(`${errors.length} erros durante o crawl`);
    }

    const result: CrawlResult<Version> = {
      success: true,
      data: versions,
      errors,
      timestamp: new Date().toISOString(),
      totalItems: versions.length,
    };

    fileHandler.save('versions.json', result);
    logger.success('Dados salvos em data/versions.json');

    return result;
  } catch (error) {
    const err = error as Error;
    logger.error('Erro ao fazer crawl de versões', err);
    errors.push(err.message);

    return {
      success: false,
      data: versions,
      errors,
      timestamp: new Date().toISOString(),
      totalItems: versions.length,
    };
  }
}

// Executar se for chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  crawlVersions()
    .then((result) => {
      if (result.success) {
        logger.success('Crawl de versões concluído com sucesso!');
        process.exit(0);
      } else {
        logger.error('Crawl de versões falhou');
        process.exit(1);
      }
    })
    .catch((error) => {
      logger.error('Erro fatal', error);
      process.exit(1);
    });
}
