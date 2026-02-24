/**
 * Script para exportar os dados coletados como SQL INSERT statements
 *
 * Este script gera um arquivo SQL que pode ser executado diretamente
 * no banco de dados para popular as tabelas.
 *
 * Uso:
 *   tsx src/scripts/export-to-sql.ts
 */

import fs from 'fs';
import path from 'path';
import { Logger } from '../utils/logger.js';
import { FileHandler } from '../utils/file-handler.js';
import type { Brand, Model, Version, CrawlResult } from '../types/vehicle.js';

const logger = new Logger('export-sql');
const fileHandler = new FileHandler();

function escapeString(str: string): string {
  return str.replace(/'/g, "''");
}

function generateBrandInserts(brands: Brand[]): string[] {
  return brands.map(
    brand =>
      `INSERT INTO brands (id, name, slug) VALUES ('${brand.id}', '${escapeString(
        brand.name
      )}', '${brand.slug}') ON CONFLICT (id) DO NOTHING;`
  );
}

function generateModelInserts(models: Model[]): string[] {
  return models.map(
    model =>
      `INSERT INTO models (id, name, slug, brand_id) VALUES ('${model.id}', '${escapeString(
        model.name
      )}', '${model.slug}', '${model.brandId}') ON CONFLICT (id) DO NOTHING;`
  );
}

function generateVersionInserts(versions: Version[]): string[] {
  return versions.map(version => {
    const year = version.year ? `'${version.year}'` : 'NULL';
    const fuelType = version.fuelType ? `'${escapeString(version.fuelType)}'` : 'NULL';
    const transmission = version.transmission
      ? `'${escapeString(version.transmission)}'`
      : 'NULL';

    return `INSERT INTO versions (id, name, slug, model_id, year, fuel_type, transmission) VALUES ('${
      version.id
    }', '${escapeString(version.name)}', '${version.slug}', '${version.modelId}', ${year}, ${fuelType}, ${transmission}) ON CONFLICT (id) DO NOTHING;`;
  });
}

async function exportToSQL() {
  logger.info('Exportando dados para SQL...\n');

  try {
    // Carregar dados
    const brandsResult = fileHandler.load<CrawlResult<Brand>>('brands.json');
    const modelsResult = fileHandler.load<CrawlResult<Model>>('models.json');
    const versionsResult = fileHandler.load<CrawlResult<Version>>('versions.json');

    if (!brandsResult || !modelsResult) {
      throw new Error('Dados de marcas ou modelos não encontrados');
    }

    const sqlStatements: string[] = [
      '-- Importação de dados de veículos',
      `-- Gerado em: ${new Date().toISOString()}`,
      '',
      '-- Desabilitar triggers e checks temporariamente',
      'BEGIN;',
      '',
      '-- Marcas',
      `-- Total: ${brandsResult.totalItems} marcas`,
      '',
      ...generateBrandInserts(brandsResult.data),
      '',
      '-- Modelos',
      `-- Total: ${modelsResult.totalItems} modelos`,
      '',
      ...generateModelInserts(modelsResult.data),
      '',
    ];

    if (versionsResult && versionsResult.data.length > 0) {
      sqlStatements.push(
        '-- Versões',
        `-- Total: ${versionsResult.totalItems} versões`,
        '',
        ...generateVersionInserts(versionsResult.data),
        ''
      );
    }

    sqlStatements.push('COMMIT;', '');

    // Salvar arquivo SQL
    const outputDir = path.join(process.cwd(), 'data');
    const outputFile = path.join(outputDir, 'import-vehicles.sql');

    fs.writeFileSync(outputFile, sqlStatements.join('\n'), 'utf-8');

    logger.success(`SQL exportado para: ${outputFile}`);
    logger.info('\nResumo:');
    logger.info(`  Marcas: ${brandsResult.totalItems}`);
    logger.info(`  Modelos: ${modelsResult.totalItems}`);
    logger.info(`  Versões: ${versionsResult?.totalItems || 0}`);
    logger.info('\nPara importar no banco de dados:');
    logger.info(`  psql -d seu_banco -f ${outputFile}`);
  } catch (error) {
    logger.error('Erro ao exportar SQL', error as Error);
    process.exit(1);
  }
}

// Executar
exportToSQL();
