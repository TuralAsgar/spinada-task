import { Sequelize } from 'sequelize';
import { config, isDevelopment, isTest } from './environment';
import logger from '../utils/logger';

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: isTest ? ':memory:' : config.DATABASE_PATH,
  logging: isDevelopment
    ? (msg: string): void => {
        logger.info(msg);
      }
    : false,
  define: {
    timestamps: true,
  },
});

export default sequelize;
