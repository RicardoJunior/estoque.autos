import { Logger } from './logger.js';
import { FileHandler } from './file-handler.js';
import type { Brand, Model, Version, CrawlResult } from '../types/vehicle.js';

const logger = new Logger('validate');
const fileHandler = new FileHandler();

/**
 * Valida os dados coletados
 */
function validateData() {
  logger.info('Iniciando validação de dados...\n');

  let hasErrors = false;

  // 1. Validar marcas
  logger.info('Validando marcas...');
  const brandsResult = fileHandler.load<CrawlResult<Brand>>('brands.json');

  if (!brandsResult) {
    logger.error('Arquivo brands.json não encontrado');
    hasErrors = true;
  } else {
    const brands = brandsResult.data;
    logger.success(`✓ ${brands.length} marcas encontradas`);

    // Verificar duplicatas
    const brandNames = new Set<string>();
    const duplicates: string[] = [];

    brands.forEach(brand => {
      if (brandNames.has(brand.name)) {
        duplicates.push(brand.name);
      }
      brandNames.add(brand.name);
    });

    if (duplicates.length > 0) {
      logger.warn(`⚠ Marcas duplicadas: ${duplicates.join(', ')}`);
      hasErrors = true;
    } else {
      logger.success('✓ Nenhuma marca duplicada');
    }

    // Verificar campos obrigatórios
    const incomplete = brands.filter(b => !b.id || !b.name || !b.slug);
    if (incomplete.length > 0) {
      logger.error(`✗ ${incomplete.length} marcas com campos incompletos`);
      hasErrors = true;
    } else {
      logger.success('✓ Todas as marcas têm campos obrigatórios');
    }
  }

  // 2. Validar modelos
  logger.info('\nValidando modelos...');
  const modelsResult = fileHandler.load<CrawlResult<Model>>('models.json');

  if (!modelsResult) {
    logger.error('Arquivo models.json não encontrado');
    hasErrors = true;
  } else {
    const models = modelsResult.data;
    logger.success(`✓ ${models.length} modelos encontrados`);

    // Verificar referências às marcas
    if (brandsResult) {
      const brandIds = new Set(brandsResult.data.map(b => b.id));
      const invalidRefs = models.filter(m => !brandIds.has(m.brandId));

      if (invalidRefs.length > 0) {
        logger.error(
          `✗ ${invalidRefs.length} modelos com referências inválidas a marcas`
        );
        hasErrors = true;
      } else {
        logger.success('✓ Todas as referências a marcas são válidas');
      }
    }

    // Verificar campos obrigatórios
    const incomplete = models.filter(
      m => !m.id || !m.name || !m.slug || !m.brandId
    );
    if (incomplete.length > 0) {
      logger.error(`✗ ${incomplete.length} modelos com campos incompletos`);
      hasErrors = true;
    } else {
      logger.success('✓ Todos os modelos têm campos obrigatórios');
    }

    // Estatísticas por marca
    logger.info('\nModelos por marca (top 10):');
    const modelsByBrand = new Map<string, number>();
    models.forEach(m => {
      modelsByBrand.set(m.brandName, (modelsByBrand.get(m.brandName) || 0) + 1);
    });

    const sorted = Array.from(modelsByBrand.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    sorted.forEach(([brand, count]) => {
      logger.info(`  ${brand}: ${count} modelos`);
    });
  }

  // 3. Validar versões
  logger.info('\nValidando versões...');
  const versionsResult = fileHandler.load<CrawlResult<Version>>('versions.json');

  if (!versionsResult) {
    logger.warn('Arquivo versions.json não encontrado (opcional)');
  } else {
    const versions = versionsResult.data;
    logger.success(`✓ ${versions.length} versões encontradas`);

    // Verificar referências aos modelos
    if (modelsResult) {
      const modelIds = new Set(modelsResult.data.map(m => m.id));
      const invalidRefs = versions.filter(v => !modelIds.has(v.modelId));

      if (invalidRefs.length > 0) {
        logger.error(
          `✗ ${invalidRefs.length} versões com referências inválidas a modelos`
        );
        hasErrors = true;
      } else {
        logger.success('✓ Todas as referências a modelos são válidas');
      }
    }

    // Verificar campos obrigatórios
    const incomplete = versions.filter(
      v => !v.id || !v.name || !v.slug || !v.modelId
    );
    if (incomplete.length > 0) {
      logger.error(`✗ ${incomplete.length} versões com campos incompletos`);
      hasErrors = true;
    } else {
      logger.success('✓ Todas as versões têm campos obrigatórios');
    }

    // Estatísticas
    if (modelsResult) {
      const avgVersionsPerModel = (versions.length / modelsResult.data.length).toFixed(
        2
      );
      logger.info(`\nMédia de versões por modelo: ${avgVersionsPerModel}`);
    }
  }

  // Resultado final
  logger.info('\n========================================');
  if (hasErrors) {
    logger.error('✗ Validação concluída com erros');
    logger.warn('Corrija os problemas antes de importar os dados');
    process.exit(1);
  } else {
    logger.success('✓ Validação concluída sem erros');
    logger.success('Os dados estão prontos para serem importados');
    process.exit(0);
  }
}

// Executar
validateData();
