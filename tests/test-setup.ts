import dotenv from 'dotenv';
import { jest } from '@jest/globals';
import app from '../src/app';
import sequelize from '../src/config/database';

dotenv.config({ path: '.env.test' });

jest.setTimeout(30000);

export const setupTestDB = async (): Promise<void> => {
  await app.connectToDatabase();
};

export const teardownTestDB = async (): Promise<void> => {
  await sequelize.close();
};

export const clearTestDB = async (): Promise<void> => {
  await sequelize.truncate({ cascade: true });
};
