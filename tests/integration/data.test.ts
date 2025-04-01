import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { clearTestDB, setupTestDB, teardownTestDB } from '../test-setup';
import request from 'supertest';
import app from '../../src/app';
import { seedDatabase } from '../seed-db';
import { WeatherService } from '../../src/services/weather.service';
import { CryptoService } from '../../src/services/crypto.service';
import { CryptoResponse, WeatherResponse } from '../../src/types/api.types';

jest.mock('../../src/services/weather.service');
jest.mock('../../src/services/crypto.service');

describe('Data Routes', () => {
  let userToken: string;

  const validParams = {
    city: 'London',
    currency: 'USD',
  };

  const mockWeatherResponse: WeatherResponse = {
    city: 'London',
    temperature: '20°C',
    weather: 'clear sky',
  };

  const mockCryptoResponse: CryptoResponse = {
    name: 'Bitcoin',
    price_usd: 80000,
  };

  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
    await seedDatabase();

    const userLoginRes = await request(app.app)
      .post('/v1/auth/login')
      .send({ email: 'user@example.com', password: 'user123' });
    userToken = userLoginRes.body.data.token;

    (WeatherService.prototype.getWeather as jest.MockedFunction<() => Promise<WeatherResponse>>).mockResolvedValue(
      mockWeatherResponse,
    );
    (CryptoService.prototype.getCryptoPrices as jest.MockedFunction<() => Promise<CryptoResponse>>).mockResolvedValue(
      mockCryptoResponse,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /v1/data', () => {
    it('should return combined data with valid parameters', async () => {
      const res = await request(app.app).get('/v1/data').query(validParams).set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual({
        ...mockWeatherResponse,
        crypto: mockCryptoResponse,
      });
      expect(WeatherService.prototype.getWeather).toHaveBeenCalledWith(validParams.city);
      expect(CryptoService.prototype.getCryptoPrices).toHaveBeenCalledWith(validParams.currency);
    });

    it('should return cached data on subsequent requests', async () => {
      const res1 = await request(app.app)
        .get('/v1/data')
        .query({ ...validParams, refresh: 'true' })
        .set('Authorization', `Bearer ${userToken}`);

      expect(res1.status).toBe(200);
      expect(res1.body.success).toBe(true);
      expect(res1.body.data).toEqual({
        ...mockWeatherResponse,
        crypto: mockCryptoResponse,
      });

      // First call should have called each service once
      expect(WeatherService.prototype.getWeather).toHaveBeenCalledTimes(1);
      expect(CryptoService.prototype.getCryptoPrices).toHaveBeenCalledTimes(1);

      // Reset the mock counters before the second request
      jest.clearAllMocks();

      // Call again with refresh=false (default)
      const res2 = await request(app.app)
        .get('/v1/data')
        .query(validParams)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res2.status).toBe(200);
      expect(res2.body.success).toBe(true);
      expect(res2.body.data).toEqual({
        ...mockWeatherResponse,
        crypto: mockCryptoResponse,
      });

      // Since we're using cache, these services should NOT be called again
      expect(WeatherService.prototype.getWeather).not.toHaveBeenCalled();
      expect(CryptoService.prototype.getCryptoPrices).not.toHaveBeenCalled();
    });

    it('should bypass cache with refresh=true', async () => {
      const res1 = await request(app.app)
        .get('/v1/data')
        .query({ ...validParams, refresh: 'true' })
        .set('Authorization', `Bearer ${userToken}`);

      expect(res1.status).toBe(200);
      expect(res1.body.success).toBe(true);
      expect(res1.body.data).toEqual({
        ...mockWeatherResponse,
        crypto: mockCryptoResponse,
      });

      expect(WeatherService.prototype.getWeather).toHaveBeenCalledTimes(1);
      expect(CryptoService.prototype.getCryptoPrices).toHaveBeenCalledTimes(1);

      jest.clearAllMocks();

      // Call again with refresh=true
      const res2 = await request(app.app)
        .get('/v1/data')
        .query({ ...validParams, refresh: 'true' })
        .set('Authorization', `Bearer ${userToken}`);

      expect(res2.status).toBe(200);
      expect(res2.body.success).toBe(true);
      expect(res2.body.data).toEqual({
        ...mockWeatherResponse,
        crypto: mockCryptoResponse,
      });

      expect(WeatherService.prototype.getWeather).toHaveBeenCalledTimes(1);
      expect(CryptoService.prototype.getCryptoPrices).toHaveBeenCalledTimes(1);
    });

    it('should fail with invalid city format', async () => {
      const res = await request(app.app)
        .get('/v1/data')
        .query({ ...validParams, city: 'A' })
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(WeatherService.prototype.getWeather).not.toHaveBeenCalled();
      expect(CryptoService.prototype.getCryptoPrices).not.toHaveBeenCalled();
    });

    it('should fail with invalid currency format', async () => {
      const res = await request(app.app)
        .get('/v1/data')
        .query({ ...validParams, currency: 'A' })
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(WeatherService.prototype.getWeather).not.toHaveBeenCalled();
      expect(CryptoService.prototype.getCryptoPrices).not.toHaveBeenCalled();
    });

    it('should fail without auth token', async () => {
      const res = await request(app.app).get('/v1/data').query(validParams);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(WeatherService.prototype.getWeather).not.toHaveBeenCalled();
      expect(CryptoService.prototype.getCryptoPrices).not.toHaveBeenCalled();
    });
  });
});
