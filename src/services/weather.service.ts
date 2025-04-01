import axios, { AxiosError } from 'axios';
import { config } from '../config/environment';
import { RetryService } from '../utils/retry';
import { OpenWeatherResponse } from '../types/weather.types';
import { WeatherResponse } from '../types/api.types';

export class WeatherService {
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

  async getWeather(city: string): Promise<WeatherResponse> {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${
      config.OPENWEATHER_API_KEY
    }&units=metric`;

    return this.retryService.retry(async () => {
      try {
        const response = await axios.get<OpenWeatherResponse>(url);

        if (!response.data?.main?.temp || !response.data?.weather?.[0]?.description) {
          throw new Error(`Invalid response format for city: ${city}`);
        }

        return {
          city: response.data.name,
          temperature: `${response.data.main.temp}°C`,
          weather: response.data.weather[0].description,
        };
      } catch (error) {
        if (error instanceof AxiosError) {
          if (error.response?.status === 429) {
            throw new Error('Rate limit exceeded. Please try again later.');
          }
          if (error.response?.status === 401) {
            throw new Error('Invalid API key');
          }
          if (error.response?.status === 404) {
            throw new Error(`City not found: ${city}`);
          }
        }
        throw error;
      }
    });
  }
}
