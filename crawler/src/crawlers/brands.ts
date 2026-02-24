import axios from 'axios';
import { Logger } from '../utils/logger.js';
import { FileHandler } from '../utils/file-handler.js';
import type { Brand, CrawlResult } from '../types/vehicle.js';

const logger = new Logger('brands');
const fileHandler = new FileHandler();

/**
 * Crawl de marcas usando a API oficial da FIPE
 */
export async function crawlBrands(): Promise<CrawlResult<Brand>> {
  logger.info('Iniciando crawl de marcas...');

  const brands: Brand[] = [];
  const errors: string[] = [];

  try {
    // URL da API oficial da FIPE (pública e confiável)
    const url = 'https://parallelum.com.br/fipe/api/v1/carros/marcas';

    logger.info(`Fazendo requisição para: ${url}`);

    const response = await axios.get(url);

    if (Array.isArray(response.data)) {
      logger.success(`Encontradas ${response.data.length} marcas via API FIPE`);

      // Processar marcas encontradas
      for (const brandData of response.data) {
        try {
          const brand: Brand = {
            id: brandData.codigo,
            name: brandData.nome,
            slug: brandData.nome
              .toLowerCase()
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-|-$/g, ''),
          };

          brands.push(brand);
        } catch (error) {
          const err = error as Error;
          logger.error(`Erro ao processar marca: ${err.message}`);
          errors.push(err.message);
        }
      }
    } else {
      throw new Error('Resposta da API FIPE não é um array');
    }

    // Ordenar marcas por nome
    brands.sort((a, b) => a.name.localeCompare(b.name));

    logger.success(`Total de marcas coletadas: ${brands.length}`);

    // Salvar resultado
    const result: CrawlResult<Brand> = {
      success: true,
      data: brands,
      errors,
      timestamp: new Date().toISOString(),
      totalItems: brands.length,
    };

    fileHandler.save('brands.json', result);
    logger.success('Dados salvos em data/brands.json');

    return result;
  } catch (error) {
    const err = error as Error;
    logger.error('Erro ao fazer crawl de marcas', err);
    errors.push(err.message);

    return {
      success: false,
      data: brands,
      errors,
      timestamp: new Date().toISOString(),
      totalItems: brands.length,
    };
  }
}

// Executar se for chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  crawlBrands()
    .then(result => {
      if (result.success) {
        logger.success('✓ Crawl de marcas concluído com sucesso!');
        process.exit(0);
      } else {
        logger.error('✗ Crawl de marcas falhou');
        process.exit(1);
      }
    })
    .catch(error => {
      logger.error('Erro fatal', error);
      process.exit(1);
    });
}
