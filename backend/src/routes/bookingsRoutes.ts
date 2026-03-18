import { Router } from 'express';
import {
  createAppointment,
  createSpecialistSlot,
  deleteSpecialistSlot,
  getMyAppointments,
  getMySpecialistAppointments,
  getSpecialistSlots,
  updateAppointmentStatus,
} from '../controllers/bookingsController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/specialists/:id/slots', getSpecialistSlots);
router.post('/specialists/:id/slots', authenticateToken, createSpecialistSlot);
router.delete('/specialists/:id/slots/:slotId', authenticateToken, deleteSpecialistSlot);

router.post('/specialists/:id/appointments', authenticateToken, createAppointment);
router.get('/appointments/me', authenticateToken, getMyAppointments);
router.get('/appointments/specialist/me', authenticateToken, getMySpecialistAppointments);
router.patch('/appointments/:id/status', authenticateToken, updateAppointmentStatus);

export default router;
