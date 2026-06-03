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
import type { Brand, Model, Version, FipePrice, CrawlResult } from '../types/vehicle.js';

const logger = new Logger('export-sql');
const fileHandler = new FileHandler();

function escapeString(str: string): string {
  return str.replace(/'/g, "''");
}

function generateBrandInserts(brands: Brand[]): string[] {
  return brands.map(
    (brand) =>
      `INSERT INTO brands (id, name, slug) VALUES ('${brand.id}', '${escapeString(
        brand.name
      )}', '${brand.slug}') ON CONFLICT (id) DO NOTHING;`
  );
}

function generateModelInserts(models: Model[]): string[] {
  return models.map(
    (model) =>
      `INSERT INTO models (id, name, slug, brand_id) VALUES ('${model.id}', '${escapeString(
        model.name
      )}', '${model.slug}', '${model.brandId}') ON CONFLICT (id) DO NOTHING;`
  );
}

function generateVersionInserts(versions: Version[]): string[] {
  return versions.map(
    (version) =>
      `INSERT INTO versions (id, name, slug, year_code, model_id) VALUES ('${escapeString(
        version.id
      )}', '${escapeString(version.name)}', '${version.slug}', '${escapeString(
        version.yearCode
      )}', '${version.modelId}') ON CONFLICT (id) DO NOTHING;`
  );
}

function generateFipePriceInserts(prices: FipePrice[]): string[] {
  return prices.map((price) => {
    return `INSERT INTO fipe_prices (id, codigo_fipe, preco, marca, modelo, ano_modelo, combustivel, sigla_combustivel, mes_referencia, model_id, year_code) VALUES ('${escapeString(
      price.id
    )}', '${escapeString(price.codigoFipe)}', '${escapeString(
      price.preco
    )}', '${escapeString(price.marca)}', '${escapeString(
      price.modelo
    )}', ${price.anoModelo}, '${escapeString(
      price.combustivel
    )}', '${escapeString(price.siglaCombustivel)}', '${escapeString(
      price.mesReferencia
    )}', '${price.modelId}', '${escapeString(price.yearCode)}') ON CONFLICT (id) DO NOTHING;`;
  });
}

async function exportToSQL() {
  logger.info('Exportando dados para SQL...\n');

  try {
    // Carregar dados
    const brandsResult = fileHandler.load<CrawlResult<Brand>>('brands.json');
    const modelsResult = fileHandler.load<CrawlResult<Model>>('models.json');
    const versionsResult = fileHandler.load<CrawlResult<Version>>('versions.json');
    const fipePricesResult = fileHandler.load<CrawlResult<FipePrice>>('fipe-prices.json');

    if (!brandsResult || !modelsResult) {
      throw new Error('Dados de marcas ou modelos não encontrados');
    }

    const sqlStatements: string[] = [
      '-- Importação de dados de veículos',
      `-- Gerado em: ${new Date().toISOString()}`,
      '',
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
        '-- Versões (Anos)',
        `-- Total: ${versionsResult.totalItems} versões`,
        '',
        ...generateVersionInserts(versionsResult.data),
        ''
      );
    }

    if (fipePricesResult && fipePricesResult.data.length > 0) {
      sqlStatements.push(
        '-- Preços FIPE',
        `-- Total: ${fipePricesResult.totalItems} preços`,
        '',
        ...generateFipePriceInserts(fipePricesResult.data),
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
    logger.info(`  Marcas:      ${brandsResult.totalItems}`);
    logger.info(`  Modelos:     ${modelsResult.totalItems}`);
    logger.info(`  Versões:     ${versionsResult?.totalItems || 0}`);
    logger.info(`  Preços FIPE: ${fipePricesResult?.totalItems || 0}`);
    logger.info('\nPara importar no banco de dados:');
    logger.info(`  psql -d seu_banco -f ${outputFile}`);
  } catch (error) {
    logger.error('Erro ao exportar SQL', error as Error);
    process.exit(1);
  }
}

// Executar
exportToSQL();
