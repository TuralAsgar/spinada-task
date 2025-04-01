import User, { UserRole } from '../src/models/user.model';
import bcrypt from 'bcryptjs';
import logger from '../src/utils/logger';
import { isProduction } from '../src/config/environment';
import sequelize from '../src/config/database';

export async function seedDatabase(forceSync = false): Promise<{ admin: User; user: User }> {
  let admin: User | undefined;
  let user: User | undefined;
  try {
    if (isProduction) {
      throw new Error('Seeding is not allowed in production');
    }

    if (forceSync) {
      await sequelize.sync({ force: true }); // Reset the database
      logger.info('Database tables recreated');
    }

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    admin = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: adminPassword,
      role: UserRole.ADMIN,
    });

    // Create regular user
    const userPassword = await bcrypt.hash('user123', 10);
    user = await User.create({
      name: 'Regular User',
      email: 'user@example.com',
      password: userPassword,
      role: UserRole.USER,
    });

    logger.info('Database seeded successfully');
    return { admin, user };
  } catch (error) {
    logger.error('Seeding error:', error);
    throw error;
  }
}

// Auto-execute when run directly via `npm run seed`
const isDirectExecution = process.argv[1]?.endsWith('seed-db.ts');

if (isDirectExecution) {
  sequelize
    .sync({ force: true })
    .then(() => seedDatabase())
    .then(() => {
      logger.info('Database setup completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Database setup failed:', error);
      process.exit(1);
    });
}
