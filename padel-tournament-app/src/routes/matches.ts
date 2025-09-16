import { Router } from 'express';
import MatchController from '../controllers/matchController';

const router = Router();
const matchController = new MatchController();

// Rutas relacionadas con los partidos
router.post('/', matchController.createMatch.bind(matchController));
router.get('/', matchController.getAllMatches.bind(matchController));
router.get('/:id', matchController.getMatchById.bind(matchController));
router.put('/:id', matchController.updateMatch.bind(matchController));
router.delete('/:id', matchController.deleteMatch.bind(matchController));

export default router;