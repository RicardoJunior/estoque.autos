import { Logger } from '../utils/logger.js';
import { crawlBrands } from './brands.js';
import { crawlModels } from './models.js';
import { crawlVersions } from './versions.js';

const logger = new Logger('all');

/**
 * Executa o crawl completo: marcas -> modelos -> versões
 */
async function crawlAll() {
  logger.info('========================================');
  logger.info('Iniciando crawl completo de veículos');
  logger.info('========================================\n');

  const startTime = Date.now();

  try {
    // 1. Crawl de marcas
    logger.info('ETAPA 1/3: Crawl de marcas');
    logger.info('----------------------------------------');
    const brandsResult = await crawlBrands();

    if (!brandsResult.success) {
      throw new Error('Falha no crawl de marcas');
    }

    logger.success(`✓ Marcas: ${brandsResult.totalItems} coletadas\n`);

    // 2. Crawl de modelos
    logger.info('ETAPA 2/3: Crawl de modelos');
    logger.info('----------------------------------------');
    const modelsResult = await crawlModels();

    if (!modelsResult.success) {
      throw new Error('Falha no crawl de modelos');
    }

    logger.success(`✓ Modelos: ${modelsResult.totalItems} coletados\n`);

    // 3. Crawl de versões
    logger.info('ETAPA 3/3: Crawl de versões');
    logger.info('----------------------------------------');
    const versionsResult = await crawlVersions();

    if (!versionsResult.success) {
      throw new Error('Falha no crawl de versões');
    }

    logger.success(`✓ Versões: ${versionsResult.totalItems} coletadas\n`);

    // Resumo final
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    logger.info('========================================');
    logger.info('RESUMO FINAL');
    logger.info('========================================');
    logger.success(`✓ Marcas:  ${brandsResult.totalItems}`);
    logger.success(`✓ Modelos: ${modelsResult.totalItems}`);
    logger.success(`✓ Versões: ${versionsResult.totalItems}`);
    logger.info(`Tempo total: ${duration}s`);
    logger.info('========================================\n');

    // Relatório de erros
    const totalErrors =
      brandsResult.errors.length +
      modelsResult.errors.length +
      versionsResult.errors.length;

    if (totalErrors > 0) {
      logger.warn(`⚠ ${totalErrors} erros encontrados durante o crawl`);
      logger.warn('Verifique os arquivos de log para mais detalhes');
    }

    logger.success('✓ Crawl completo finalizado com sucesso!');
    process.exit(0);
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    logger.error('\n========================================');
    logger.error('ERRO NO CRAWL');
    logger.error('========================================');
    logger.error((error as Error).message);
    logger.info(`Tempo decorrido: ${duration}s`);
    logger.error('========================================\n');

    process.exit(1);
  }
}

// Executar
crawlAll();
