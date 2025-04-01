import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import AuthController from '../../controllers/auth.controller';
import { validateRequest } from '../../utils/validate-request';
import { loginSchema, registerSchema } from './auth.validation';

const router = Router();

// guest routes
router.post('/register', validateRequest({ body: registerSchema }), AuthController.register);
router.post('/login', validateRequest({ body: loginSchema }), AuthController.login);

// protected routes
router.get('/profile', authMiddleware, AuthController.profile);

export default router;
