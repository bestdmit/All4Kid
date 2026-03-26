import {Router} from "express";
import {approveReview, deleteReview, getUnapprovedReviews} from "../controllers/reviewsController";
import {authenticateToken, authorize} from "../middleware/auth";

const router = Router();

router.get('/reviews', getUnapprovedReviews);
router.post('/review/approve', authenticateToken, authorize('admin'), approveReview);
router.post('/review/delete', authenticateToken, authorize('admin'), deleteReview);

export default router;