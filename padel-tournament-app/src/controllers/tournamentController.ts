import { Request, Response } from 'express';
import TournamentService from '../services/tournamentService';

class TournamentController {
    private tournamentService: TournamentService;

    constructor() {
        this.tournamentService = new TournamentService();
    }

    public createTournament = async (req: Request, res: Response): Promise<void> => {
        try {
            const tournamentData = req.body;
            const tournament = await this.tournamentService.createTournament(tournamentData);
            res.status(201).json(tournament);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    };

    public getTournaments = async (req: Request, res: Response): Promise<void> => {
        try {
            const tournaments = await this.tournamentService.getTournaments();
            res.status(200).json(tournaments);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    };

    public getTournamentById = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const tournament = await this.tournamentService.getTournamentById(id);
            if (tournament) {
                res.status(200).json(tournament);
            } else {
                res.status(404).json({ message: 'Tournament not found' });
            }
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    };

    public updateTournament = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const tournamentData = req.body;
            const updatedTournament = await this.tournamentService.updateTournament(id, tournamentData);
            if (updatedTournament) {
                res.status(200).json(updatedTournament);
            } else {
                res.status(404).json({ message: 'Tournament not found' });
            }
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    };

    public deleteTournament = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const deleted = await this.tournamentService.deleteTournament(id);
            if (deleted) {
                res.status(204).send();
            } else {
                res.status(404).json({ message: 'Tournament not found' });
            }
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    };
}

export default TournamentController;