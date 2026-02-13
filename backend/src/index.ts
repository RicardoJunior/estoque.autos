import { createApp } from './app';
import { config } from './config';

const app = createApp();

const server = app.listen(config.port, () => {
  // eslint-disable-next-line no-console
  console.log(`
╔═══════════════════════════════════════╗
║   Estoque.autos API Server Started   ║
╚═══════════════════════════════════════╝

Environment: ${config.node_env}
Port: ${config.port}
Supabase URL: ${config.supabase.url}

Server is ready to accept connections.
  `);
});

// Graceful shutdown
const shutdown = () => {
  // eslint-disable-next-line no-console
  console.log('\nShutting down gracefully...');
  server.close(() => {
    // eslint-disable-next-line no-console
    console.log('Server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
