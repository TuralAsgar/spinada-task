import User, { IUser, UserRole } from '../models/user.model';
import bcrypt from 'bcryptjs';

export class UserService {
  async createUser(userData: IUser): Promise<IUser | null> {
    const { email, password, name, role } = userData;

    const existingUser = await User.findOne({
      where: { email },
    });

    if (existingUser) {
      return null;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    return User.create({
      name,
      email,
      password: hashedPassword,
      role: role || UserRole.USER,
    });
  }

  async getUserById(id: string): Promise<IUser | null> {
    return User.findByPk(id, {
      attributes: { exclude: ['password'] },
    });
  }

  async getAllUsers(): Promise<IUser[]> {
    return User.findAll({
      attributes: { exclude: ['password'] },
    });
  }

  async updateUser(id: string, updateData: Partial<IUser>): Promise<IUser | null> {
    const user = await User.findByPk(id);

    if (!user) {
      return null;
    }

    // If updating password, hash it
    if (updateData.password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(updateData.password, salt);
    }

    return user.update(updateData);
  }

  async deleteUser(id: string): Promise<boolean> {
    const deletedUser = await User.destroy({ where: { id } });
    return deletedUser > 0;
  }
}
