import { Response } from 'express';
import { IUser, UserRole } from '../models/user.model';
import { UserService } from '../services/user.service';
import { AuthService } from '../services/auth.service';
import { LoginRequestBody, RegisterRequestBody } from '../types/api.types';
import { AuthenticatedRequest, TypedRequestBody } from '../types/request.types';
import { catchAsync } from '../utils/catch-async';
import { ApiResponse } from '../utils/api-response';

class AuthController {
  private userService: UserService;
  private authService: AuthService;

  constructor() {
    this.userService = new UserService();
    this.authService = new AuthService();
  }

  register = catchAsync(async (req: TypedRequestBody<RegisterRequestBody>, res: Response): Promise<void> => {
    const { name, email, password } = req.body;

    const userData: IUser = {
      name,
      email,
      password,
      role: UserRole.USER,
    };

    const user = await this.userService.createUser(userData);

    if (!user) {
      return ApiResponse.conflict(res, 'User already exists');
    }

    return ApiResponse.created(res, {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  });

  login = catchAsync(async (req: TypedRequestBody<LoginRequestBody>, res: Response): Promise<void> => {
    const { email, password } = req.body;

    const token = await this.authService.login(email, password);

    if (!token) {
      return ApiResponse.unauthorized(res, 'Invalid credentials');
    }

    return ApiResponse.success(res, { token });
  });

  profile = catchAsync(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    // middleware should have already checked for user
    // so we can safely access req.user
    // but we check it again just in case
    if (!req.user?.id) {
      return ApiResponse.unauthorized(res, 'Unauthorized');
    }

    const userProfile = await this.authService.getUserProfile(req.user.id);

    if (!userProfile) {
      return ApiResponse.notFound(res, 'User not found');
    }

    return ApiResponse.success(res, userProfile);
  });
}
export default new AuthController();
