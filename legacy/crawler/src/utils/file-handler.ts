import fs from 'fs';
import path from 'path';

export class FileHandler {
  private dataDir: string;

  constructor() {
    this.dataDir = path.join(process.cwd(), 'data');

    // Criar diretório de dados se não existir
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  /**
   * Salva dados em arquivo JSON
   */
  save<T>(filename: string, data: T): void {
    const filePath = path.join(this.dataDir, filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  }

  /**
   * Carrega dados de arquivo JSON
   */
  load<T>(filename: string): T | null {
    const filePath = path.join(this.dataDir, filename);

    if (!fs.existsSync(filePath)) {
      return null;
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content) as T;
  }

  /**
   * Verifica se arquivo existe
   */
  exists(filename: string): boolean {
    const filePath = path.join(this.dataDir, filename);
    return fs.existsSync(filePath);
  }

  /**
   * Lista arquivos no diretório de dados
   */
  listFiles(): string[] {
    return fs.readdirSync(this.dataDir);
  }

  /**
   * Remove arquivo
   */
  remove(filename: string): void {
    const filePath = path.join(this.dataDir, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  /**
   * Faz backup de arquivo
   */
  backup(filename: string): void {
    const filePath = path.join(this.dataDir, filename);

    if (!fs.existsSync(filePath)) {
      return;
    }

    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const backupPath = path.join(this.dataDir, `${filename}.${timestamp}.backup`);

    fs.copyFileSync(filePath, backupPath);
  }
}
