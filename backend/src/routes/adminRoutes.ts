import {Router} from "express";
import {approveReview, deleteReview, getUnapprovedReviews} from "../controllers/reviewsController";
import {authenticateToken, authorize} from "../middleware/auth";

const router = Router();

router.get('/admin/reviews', getUnapprovedReviews);
router.post('/admin/review/approve', authenticateToken, authorize('admin'), approveReview);
router.post('/admin/review/delete', authenticateToken, authorize('admin'), deleteReview);

export default router;