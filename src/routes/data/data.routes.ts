import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { validateRequest } from '../../utils/validate-request';
import { dataSchema } from './data.validation';
import DataController from '../../controllers/data.controller';

const router = Router();

router.get('/', authMiddleware, validateRequest({ query: dataSchema }), DataController.getData);

export default router;
