import User from '../models/user.model';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config/environment';

export class AuthService {
  async login(email: string, password: string): Promise<string | null> {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return null;
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return null;
    }

    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      config.JWT_SECRET,
      { expiresIn: '1h' },
    );
  }

  async getUserProfile(userId: string): Promise<User | null> {
    return User.findByPk(userId, {
      attributes: { exclude: ['password'] },
    });
  }
}
