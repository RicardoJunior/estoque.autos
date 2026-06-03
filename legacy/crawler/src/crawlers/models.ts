import axios from 'axios';
import pLimit from 'p-limit';
import { Logger } from '../utils/logger.js';
import { FileHandler } from '../utils/file-handler.js';
import { randomDelay } from '../utils/delay.js';
import type { Brand, Model, CrawlResult } from '../types/vehicle.js';

const logger = new Logger('models');
const fileHandler = new FileHandler();

/**
 * Crawl de modelos para uma marca específica usando API FIPE
 */
async function crawlModelsForBrand(brand: Brand): Promise<Model[]> {
  const models: Model[] = [];

  try {
    // Aguardar um pouco entre requisições para não sobrecarregar a API
    await randomDelay(300, 800);

    // URL da API oficial da FIPE para buscar modelos de uma marca
    const url = `https://parallelum.com.br/fipe/api/v1/carros/marcas/${brand.id}/modelos`;

    logger.info(`Buscando modelos para: ${brand.name} (ID: ${brand.id})`);

    const response = await axios.get(url, {
      timeout: 15000,
    });

    // A API FIPE retorna um objeto com a chave "modelos"
    if (response.data && Array.isArray(response.data.modelos)) {
      for (const modelData of response.data.modelos) {
        try {
          const model: Model = {
            id: modelData.codigo.toString(),
            name: modelData.nome,
            slug: modelData.nome
              .toLowerCase()
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-|-$/g, ''),
            brandId: brand.id,
            brandName: brand.name,
          };

          models.push(model);
        } catch (error) {
          logger.error(`Erro ao processar modelo: ${(error as Error).message}`);
        }
      }
    }

    logger.success(`${brand.name}: ${models.length} modelos encontrados`);

    return models;
  } catch (error) {
    logger.error(`Erro ao buscar modelos de ${brand.name}`, error as Error);
    return [];
  }
}

/**
 * Crawl de todos os modelos
 */
export async function crawlModels(): Promise<CrawlResult<Model>> {
  logger.info('Iniciando crawl de modelos...');

  const models: Model[] = [];
  const errors: string[] = [];

  try {
    // Carregar marcas
    const brandsResult = fileHandler.load<CrawlResult<Brand>>('brands.json');

    if (!brandsResult || !brandsResult.data) {
      throw new Error(
        'Arquivo de marcas não encontrado. Execute crawl:brands primeiro.'
      );
    }

    const brands = brandsResult.data;
    logger.info(`${brands.length} marcas carregadas`);

    // Limitar paralelismo para não sobrecarregar o servidor
    const limit = pLimit(3);

    // Crawl de modelos para cada marca
    const promises = brands.map(brand =>
      limit(async () => {
        try {
          const brandModels = await crawlModelsForBrand(brand);
          return brandModels;
        } catch (error) {
          errors.push(`${brand.name}: ${(error as Error).message}`);
          return [];
        }
      })
    );

    const results = await Promise.all(promises);

    // Consolidar todos os modelos
    results.forEach(brandModels => {
      models.push(...brandModels);
    });

    // Ordenar modelos
    models.sort((a, b) => {
      const brandCompare = a.brandName.localeCompare(b.brandName);
      if (brandCompare !== 0) return brandCompare;
      return a.name.localeCompare(b.name);
    });

    logger.success(`Total de modelos coletados: ${models.length}`);

    // Salvar resultado
    const result: CrawlResult<Model> = {
      success: true,
      data: models,
      errors,
      timestamp: new Date().toISOString(),
      totalItems: models.length,
    };

    fileHandler.save('models.json', result);
    logger.success('Dados salvos em data/models.json');

    return result;
  } catch (error) {
    const err = error as Error;
    logger.error('Erro ao fazer crawl de modelos', err);
    errors.push(err.message);

    return {
      success: false,
      data: models,
      errors,
      timestamp: new Date().toISOString(),
      totalItems: models.length,
    };
  }
}

// Executar se for chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  crawlModels()
    .then(result => {
      if (result.success) {
        logger.success('✓ Crawl de modelos concluído com sucesso!');
        process.exit(0);
      } else {
        logger.error('✗ Crawl de modelos falhou');
        process.exit(1);
      }
    })
    .catch(error => {
      logger.error('Erro fatal', error);
      process.exit(1);
    });
}
