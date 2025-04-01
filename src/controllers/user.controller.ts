import { Request, Response } from 'express';
import { IUser, UserRole } from '../models/user.model';
import { UserService } from '../services/user.service';
import { TypedRequestBody } from '../types/request.types';
import { UpdateUserRequestBody } from '../types/api.types';
import { catchAsync } from '../utils/catch-async';
import { ApiResponse } from '../utils/api-response';

class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  getAllUsers = catchAsync(async (_req: Request, res: Response): Promise<void> => {
    const users = await this.userService.getAllUsers();
    return ApiResponse.success(res, users);
  });

  getUserById = catchAsync(async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    const { id } = req.params;

    const isAdmin = req.user?.role === UserRole.ADMIN;

    if (!isAdmin && req.user?.id !== id) {
      return ApiResponse.forbidden(res, 'You do not have permission to access this resource');
    }

    const user = await this.userService.getUserById(id);

    if (!user) {
      return ApiResponse.notFound(res, 'User not found');
    }

    return ApiResponse.success(res, user);
  });

  updateUserById = catchAsync(async (req: TypedRequestBody<UpdateUserRequestBody>, res: Response): Promise<void> => {
    const { id } = req.params;
    const isAdmin = req.user?.role === UserRole.ADMIN;

    if (!isAdmin && req.user?.id !== id) {
      return ApiResponse.forbidden(res, 'You do not have permission to access this resource');
    }

    // email and role can only be updated by admin
    const { email, role, ...rest } = req.body;
    const updateData: Partial<IUser> = {
      ...rest,
    };

    if (isAdmin) {
      if (email) updateData.email = email;
      if (role) updateData.role = role as UserRole;
    }

    if (!isAdmin && (email || role)) {
      return ApiResponse.forbidden(res, 'You do not have permission to update email or role');
    }

    const updatedUser = await this.userService.updateUser(id, updateData);

    if (!updatedUser) {
      return ApiResponse.notFound(res, 'User not found');
    }

    return ApiResponse.success(res, {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
    });
  });

  deleteUserById = catchAsync(async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    const { id } = req.params;
    const success = await this.userService.deleteUser(id);

    if (!success) {
      return ApiResponse.notFound(res, 'User not found');
    }

    return ApiResponse.success(res, { message: 'User deleted successfully' });
  });
}

export default new UserController();
