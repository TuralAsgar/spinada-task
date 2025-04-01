import retry from 'retry';
import logger from './logger';

export class RetryService {
  private operation: retry.RetryOperation;

  constructor(options: retry.OperationOptions = {}) {
    this.operation = retry.operation({
      retries: 3,
      factor: 2,
      minTimeout: 1000,
      maxTimeout: 10000,
      randomize: true,
      ...options,
    });
  }

  async retry<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.operation.attempt(async (currentAttempt) => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          logger.warn(`Attempt ${currentAttempt} failed: ${(error as Error).message}`);

          if (this.operation.retry(error as Error)) {
            return;
          }

          // Create a new Error object to ensure proper error propagation
          const finalError = new Error((error as Error).message);
          finalError.name = (error as Error).name;
          reject(finalError);
        }
      });
    });
  }

  reset(): void {
    this.operation.reset();
  }
}
