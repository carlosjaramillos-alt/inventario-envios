import { Router } from 'express';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../controllers/productController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, getProducts);
router.post('/', authenticateToken, createProduct);
router.put('/:id', authenticateToken, updateProduct);
router.delete('/:id', authenticateToken, deleteProduct);

export default router;