import {Router} from "express";
import {approveReview, deleteReview, getUnapprovedReviews} from "../controllers/reviewsController";
import { approveSpecialist, getPendingSpecialists, getSpecialistByIdForAdmin } from "../controllers/specialistsController";
import {authenticateToken, authorize} from "../middleware/auth";

const router = Router();

router.get('/reviews', getUnapprovedReviews);
router.post('/review/approve', authenticateToken, authorize('admin'), approveReview);
router.post('/review/delete', authenticateToken, authorize('admin'), deleteReview);
router.get('/specialists/pending', authenticateToken, authorize('admin'), getPendingSpecialists);
router.get('/specialists/:id', authenticateToken, authorize('admin'), getSpecialistByIdForAdmin);
router.post('/specialists/:id/approve', authenticateToken, authorize('admin'), approveSpecialist);

export default router;