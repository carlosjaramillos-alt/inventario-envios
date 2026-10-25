import { Router } from 'express';
import { getSedes, createSede, asignarUsuarioSede } from '../controllers/sedeController';
import { authenticateToken } from '../middleware/auth';
import { verificarRol } from '../middleware/permisos';

const router = Router();

// Todas las rutas de sedes requieren token JWT válido
router.use(authenticateToken);

// Consultar sedes asignadas al usuario
router.get('/', getSedes);

// Crear una nueva sede (Solo Rol 'admin')
router.post('/', verificarRol(['admin']), createSede);

// Asignar un usuario a un frente (Solo Rol 'admin')
router.post('/asignar-usuario', verificarRol(['admin']), asignarUsuarioSede);

export default router;