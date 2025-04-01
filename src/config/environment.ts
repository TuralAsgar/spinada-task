// import dotenv from 'dotenv';
// dotenv.config();
//
// export const config = {
//   PORT: process.env.PORT || 3000,
//   DATABASE_PATH: process.env.DATABASE_PATH || '../database.sqlite',
//   JWT_SECRET: process.env.JWT_SECRET,
//   OPENWEATHER_API_KEY: process.env.OPENWEATHER_API_KEY,
//   COINGECKO_API_KEY: process.env.COINGECKO_API_KEY,
//   NODE_ENV: process.env.NODE_ENV || 'development',
// };
//
// export const isTest = config.NODE_ENV === 'test';
// export const isProduction = config.NODE_ENV === 'production';
// export const isDevelopment = config.NODE_ENV === 'development';

import dotenv from 'dotenv';
import z from 'zod';

// Load environment variables
dotenv.config();

// Define the schema for environment variables
const envSchema = z.object({
  PORT: z
    .string()
    .default('3000')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().positive().max(65535)),

  DATABASE_PATH: z.string().min(1, 'Database path cannot be empty').default('../database.sqlite'),
  JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters').nonempty('JWT secret is required'),
  OPENWEATHER_API_KEY: z.string().min(1, 'OpenWeather API key is required'),
  COINGECKO_API_KEY: z.string().min(1, 'CoinGecko API key is required'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

// Create a type from the schema
type EnvConfig = z.infer<typeof envSchema>;

// Validate and export the config
function validateConfig(): EnvConfig {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map((err) => `${err.path}: ${err.message}`);
      throw new Error(`❌ Invalid environment variables:\n${missingVars.join('\n')}`);
    }
    throw error;
  }
}

export const config = validateConfig();

// Export environment helper functions
export const isTest = config.NODE_ENV === 'test';
export const isProduction = config.NODE_ENV === 'production';
export const isDevelopment = config.NODE_ENV === 'development';
