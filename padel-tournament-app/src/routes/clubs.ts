import { Router } from 'express';
import ClubController from '../controllers/clubController';

const router = Router();
const clubController = new ClubController();

// Rutas para manejar clubes
router.post('/clubs', clubController.registerClub);
router.get('/clubs', clubController.getAllClubs);
router.get('/clubs/:id', clubController.getClubById);

export default router;