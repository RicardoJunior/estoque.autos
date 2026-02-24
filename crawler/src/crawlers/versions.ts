import axios from 'axios';
import pLimit from 'p-limit';
import { Logger } from '../utils/logger.js';
import { FileHandler } from '../utils/file-handler.js';
import { randomDelay } from '../utils/delay.js';
import type { Model, Version, CrawlResult } from '../types/vehicle.js';

const logger = new Logger('versions');
const fileHandler = new FileHandler();

/**
 * Crawl de versões para um modelo específico
 */
async function crawlVersionsForModel(model: Model): Promise<Version[]> {
  const versions: Version[] = [];

  try {
    // Aguardar um pouco entre requisições
    await randomDelay(500, 1500);

    // URL da API do Webmotors para buscar versões
    // A API pode variar, então vamos tentar diferentes endpoints
    const urls = [
      `https://www.webmotors.com.br/api/VehicleVersion?modelId=${model.id}`,
      `https://www.webmotors.com.br/api/Typeahead/Versoes?marca=${encodeURIComponent(
        model.brandName
      )}&modelo=${encodeURIComponent(model.name)}`,
    ];

    for (const url of urls) {
      try {
        const response = await axios.get(url, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            Accept: 'application/json',
            Referer: 'https://www.webmotors.com.br/',
          },
          timeout: 10000,
        });

        if (Array.isArray(response.data) && response.data.length > 0) {
          for (const versionData of response.data) {
            try {
              const version: Version = {
                id: versionData.Id || versionData.id || String(versions.length + 1),
                name: versionData.Nome || versionData.name || versionData.Versao,
                slug: (versionData.Nome || versionData.name || versionData.Versao)
                  .toLowerCase()
                  .normalize('NFD')
                  .replace(/[\u0300-\u036f]/g, '')
                  .replace(/[^a-z0-9]+/g, '-')
                  .replace(/^-|-$/g, ''),
                modelId: model.id,
                modelName: model.name,
                brandId: model.brandId,
                brandName: model.brandName,
                year: versionData.Ano || versionData.year,
                fuelType: versionData.Combustivel || versionData.fuelType,
                transmission: versionData.Cambio || versionData.transmission,
              };

              versions.push(version);
            } catch (error) {
              logger.error(`Erro ao processar versão: ${(error as Error).message}`);
            }
          }

          // Se encontrou versões neste endpoint, não precisa tentar os outros
          break;
        }
      } catch (error) {
        // Continuar para o próximo URL
        continue;
      }
    }

    if (versions.length > 0) {
      logger.info(`${model.brandName} ${model.name}: ${versions.length} versões`);
    }

    return versions;
  } catch (error) {
    logger.error(
      `Erro ao buscar versões de ${model.brandName} ${model.name}`,
      error as Error
    );
    return [];
  }
}

/**
 * Crawl de todas as versões
 */
export async function crawlVersions(): Promise<CrawlResult<Version>> {
  logger.info('Iniciando crawl de versões...');

  const versions: Version[] = [];
  const errors: string[] = [];

  try {
    // Carregar modelos
    const modelsResult = fileHandler.load<CrawlResult<Model>>('models.json');

    if (!modelsResult || !modelsResult.data) {
      throw new Error(
        'Arquivo de modelos não encontrado. Execute crawl:models primeiro.'
      );
    }

    const models = modelsResult.data;
    logger.info(`${models.length} modelos carregados`);

    // Limitar paralelismo para não sobrecarregar o servidor
    const limit = pLimit(2);

    let processed = 0;

    // Crawl de versões para cada modelo
    const promises = models.map(model =>
      limit(async () => {
        try {
          const modelVersions = await crawlVersionsForModel(model);
          processed++;
          logger.progress(processed, models.length, `${model.brandName} ${model.name}`);
          return modelVersions;
        } catch (error) {
          errors.push(
            `${model.brandName} ${model.name}: ${(error as Error).message}`
          );
          processed++;
          return [];
        }
      })
    );

    const results = await Promise.all(promises);

    // Consolidar todas as versões
    results.forEach(modelVersions => {
      versions.push(...modelVersions);
    });

    // Ordenar versões
    versions.sort((a, b) => {
      const brandCompare = a.brandName.localeCompare(b.brandName);
      if (brandCompare !== 0) return brandCompare;

      const modelCompare = a.modelName.localeCompare(b.modelName);
      if (modelCompare !== 0) return modelCompare;

      return a.name.localeCompare(b.name);
    });

    logger.success(`\nTotal de versões coletadas: ${versions.length}`);

    // Salvar resultado
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
    .then(result => {
      if (result.success) {
        logger.success('✓ Crawl de versões concluído com sucesso!');
        process.exit(0);
      } else {
        logger.error('✗ Crawl de versões falhou');
        process.exit(1);
      }
    })
    .catch(error => {
      logger.error('Erro fatal', error);
      process.exit(1);
    });
}
