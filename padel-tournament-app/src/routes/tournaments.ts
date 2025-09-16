import { Router } from 'express';
import TournamentController from '../controllers/tournamentController';

const router = Router();
const tournamentController = new TournamentController();

// Rutas para torneos
router.post('/', tournamentController.createTournament);
router.get('/', tournamentController.getAllTournaments);
router.get('/:id', tournamentController.getTournamentById);
router.put('/:id', tournamentController.updateTournament);
router.delete('/:id', tournamentController.deleteTournament);

export default router;