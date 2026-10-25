import { Router } from 'express';
import { registrarTanqueo, getAlertas } from '../controllers/combustibleController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

// Registrar un tanqueo de combustible
router.post('/tanqueo', registrarTanqueo);

// Consultar alertas del sistema
router.get('/alertas', getAlertas);

export default router;