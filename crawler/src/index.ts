#!/usr/bin/env node

import { Logger } from './utils/logger.js';

const logger = new Logger('main');

logger.info('========================================');
logger.info('Crawler de Veículos - Estoque.autos');
logger.info('========================================\n');

logger.info('Scripts disponíveis:');
logger.info('  npm run crawl:brands   - Crawl de marcas');
logger.info('  npm run crawl:models   - Crawl de modelos');
logger.info('  npm run crawl:versions - Crawl de versões');
logger.info('  npm run crawl:all      - Crawl completo');
logger.info('  npm run validate       - Validar dados coletados\n');

logger.info('Exemplo de uso:');
logger.info('  cd crawler');
logger.info('  npm install');
logger.info('  npm run crawl:all\n');

logger.info('Os dados serão salvos em: crawler/data/');
logger.info('Os logs serão salvos em: crawler/logs/\n');
