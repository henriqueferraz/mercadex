import { Router } from 'express';
import { productsController, categoriesController } from './products.controller';
import { authenticate, requireAdmin } from '../auth/auth.middleware';

const router = Router();

// ─── Categorias (antes de /:id para evitar conflito de rota) ─────────────────
router.get('/categories', categoriesController.list);
router.post('/categories', authenticate, requireAdmin, categoriesController.create);

// ─── Produtos ─────────────────────────────────────────────────────────────────
router.get('/', productsController.list);
router.get('/:id', productsController.getById);
router.post('/', authenticate, requireAdmin, productsController.create);
router.put('/:id', authenticate, requireAdmin, productsController.update);
router.delete('/:id', authenticate, requireAdmin, productsController.remove);

export default router;
