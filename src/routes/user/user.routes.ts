import { Router } from 'express';
import { adminMiddleware, authMiddleware } from '../../middlewares/auth.middleware';
import UserController from '../../controllers/user.controller';
import { validateRequest } from '../../utils/validate-request';
import { updateUserSchema, userIdSchema } from './user.validation';

const router = Router();

// Admin only
router.get('/', authMiddleware, adminMiddleware, UserController.getAllUsers);
router.delete(
  '/:id',
  authMiddleware,
  adminMiddleware,
  validateRequest({ params: userIdSchema }),
  UserController.deleteUserById,
);

// Admin or self
router.get('/:id', authMiddleware, validateRequest({ params: userIdSchema }), UserController.getUserById);
router.patch(
  '/:id',
  authMiddleware,
  validateRequest({ params: userIdSchema, body: updateUserSchema }),
  UserController.updateUserById,
);

export default router;
