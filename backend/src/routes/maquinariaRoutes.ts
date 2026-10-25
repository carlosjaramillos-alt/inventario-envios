import { Router } from 'express';
import { getMaquinaria, createMaquinaria, actualizarHorometro } from '../controllers/maquinariaController';
import { authenticateToken } from '../middleware/auth';
import { verificarRol } from '../middleware/permisos';

const router = Router();

router.use(authenticateToken);

router.get('/', getMaquinaria);
router.post('/', verificarRol(['admin', 'jefe_frente']), createMaquinaria);
router.post('/horometro', actualizarHorometro);

export default router;