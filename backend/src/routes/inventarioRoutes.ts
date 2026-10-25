import { Router } from 'express';
import { getInventarioPorSede, registrarMovimiento } from '../controllers/inventarioController';
import { authenticateToken } from '../middleware/auth';
import { verificarAccesoSede } from '../middleware/permisos';

const router = Router();

// Requerir autenticación JWT para todas las rutas de inventario
router.use(authenticateToken);

// Obtener el inventario de una sede/frente específica (Verifica que el usuario tenga acceso a ese frente)
router.get('/sede/:sedeId', verificarAccesoSede, getInventarioPorSede);

// Registrar un movimiento de inventario (Entrada, Salida o Ajuste con Kardex)
router.post('/movimiento', verificarAccesoSede, registrarMovimiento);

export default router;