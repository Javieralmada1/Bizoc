import { Router } from 'express';
import PlayerController from '../controllers/playerController';

const router = Router();
const playerController = new PlayerController();

// Rutas para manejar jugadores
router.post('/register', playerController.registerPlayer);
router.get('/:id', playerController.getPlayerById);
router.get('/', playerController.getAllPlayers);

export default router;