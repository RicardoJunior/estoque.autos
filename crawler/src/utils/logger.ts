import fs from 'fs';
import path from 'path';

export class Logger {
  private logFile: string;
  private logsDir: string;

  constructor(logName: string) {
    this.logsDir = path.join(process.cwd(), 'logs');

    // Criar diretório de logs se não existir
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    this.logFile = path.join(this.logsDir, `${logName}-${timestamp}.log`);
  }

  private formatMessage(level: string, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level}] ${message}`;
  }

  private write(message: string): void {
    fs.appendFileSync(this.logFile, message + '\n');
  }

  info(message: string): void {
    const formatted = this.formatMessage('INFO', message);
    console.log(`\x1b[36m${formatted}\x1b[0m`);
    this.write(formatted);
  }

  success(message: string): void {
    const formatted = this.formatMessage('SUCCESS', message);
    console.log(`\x1b[32m${formatted}\x1b[0m`);
    this.write(formatted);
  }

  error(message: string, error?: Error): void {
    const errorMsg = error ? `${message}: ${error.message}` : message;
    const formatted = this.formatMessage('ERROR', errorMsg);
    console.error(`\x1b[31m${formatted}\x1b[0m`);
    this.write(formatted);
    if (error?.stack) {
      this.write(error.stack);
    }
  }

  warn(message: string): void {
    const formatted = this.formatMessage('WARN', message);
    console.warn(`\x1b[33m${formatted}\x1b[0m`);
    this.write(formatted);
  }

  progress(current: number, total: number, item?: string): void {
    const percentage = Math.round((current / total) * 100);
    const message = item
      ? `Progresso: ${current}/${total} (${percentage}%) - ${item}`
      : `Progresso: ${current}/${total} (${percentage}%)`;

    const formatted = this.formatMessage('PROGRESS', message);
    process.stdout.write(`\r\x1b[36m${formatted}\x1b[0m`);

    if (current === total) {
      console.log(''); // Nova linha no final
    }
  }
}
