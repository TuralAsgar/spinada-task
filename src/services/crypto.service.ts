import axios, { AxiosError } from 'axios';
import { RetryService } from '../utils/retry';
import { CryptoResponse } from '../types/api.types';
import { config } from '../config/environment';

export class CryptoService {
  private retryService: RetryService;

  constructor() {
    this.retryService = new RetryService({
      retries: 3,
      factor: 2,
      minTimeout: 1000,
      maxTimeout: 5000,
      randomize: true,
    });
  }

  async getCryptoPrices(currency: string): Promise<CryptoResponse> {
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${currency}&vs_currencies=usd&&x_cg_demo_api_key=${
      config.COINGECKO_API_KEY
    }`;

    return this.retryService.retry(async () => {
      try {
        const response = await axios.get(url);

        if (!response.data[currency]?.usd) {
          throw new Error(`Invalid response format for currency: ${currency}`);
        }

        return {
          name: currency,
          price_usd: response.data[currency].usd,
        };
      } catch (error) {
        if (error instanceof AxiosError) {
          if (error.response?.status === 429) {
            throw new Error('Rate limit exceeded. Please try again later.');
          }
          if (error.response?.status === 401) {
            throw new Error('Invalid API key');
          }
        }
        throw error;
      }
    });
  }
}
