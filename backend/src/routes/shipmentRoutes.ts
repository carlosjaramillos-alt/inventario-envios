import { Router } from 'express';
import { getShipments, createShipment, updateShipmentStatus, uploadShipmentEvidence } from '../controllers/shipmentController';
import { authenticateToken } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

// Rutas del módulo de envíos
router.get('/', authenticateToken, getShipments);
router.post('/', authenticateToken, createShipment);
router.patch('/:id/status', authenticateToken, updateShipmentStatus);

// Ruta para subir foto de evidencia (usa el middleware upload.single('imagen'))
router.post('/:id/evidence', authenticateToken, upload.single('imagen'), uploadShipmentEvidence);

export default router;