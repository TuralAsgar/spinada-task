import { Response } from 'express';
import { WeatherService } from '../services/weather.service';
import { CryptoService } from '../services/crypto.service';
import NodeCache from 'node-cache';
import { catchAsync } from '../utils/catch-async';
import { TypedRequestQuery } from '../types/request.types';
import { DataQueryParams } from '../types/api.types';
import { ApiResponse } from '../utils/api-response';

const CACHE_TTL = 300; // 5 minutes

export class DataController {
  private cache: NodeCache;
  private weatherService: WeatherService;
  private cryptoService: CryptoService;

  constructor() {
    this.cache = new NodeCache({ stdTTL: CACHE_TTL });
    this.weatherService = new WeatherService();
    this.cryptoService = new CryptoService();
  }

  getData = catchAsync(async (req: TypedRequestQuery<DataQueryParams>, res: Response): Promise<void> => {
    const { city, currency } = req.query;
    const refresh = req.query.refresh;

    const cacheKey = `${city}-${currency}`;

    if (!refresh && this.cache.has(cacheKey)) {
      const cachedData = this.cache.get(cacheKey);
      return ApiResponse.success(res, cachedData);
    }

    const [weatherData, cryptoData] = await Promise.all([
      this.weatherService.getWeather(city),
      this.cryptoService.getCryptoPrices(currency),
    ]);

    const combinedData = {
      ...weatherData,
      crypto: cryptoData,
    };

    this.cache.set(cacheKey, combinedData);

    return ApiResponse.success(res, combinedData);
  });
}

export default new DataController();
