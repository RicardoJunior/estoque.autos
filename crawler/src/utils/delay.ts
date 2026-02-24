/**
 * Aguarda um período de tempo aleatório entre min e max milissegundos
 */
export function randomDelay(min: number = 1000, max: number = 3000): Promise<void> {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * Aguarda um período de tempo fixo em milissegundos
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Implementa exponential backoff para retry
 */
export function exponentialBackoff(attempt: number, baseDelay: number = 1000): Promise<void> {
  const delay = baseDelay * Math.pow(2, attempt);
  return new Promise(resolve => setTimeout(resolve, delay));
}
