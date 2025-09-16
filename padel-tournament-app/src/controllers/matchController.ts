import { Request, Response } from 'express';
import Match from '../models/Match';
import TournamentService from '../services/tournamentService';

class MatchController {
    async createMatch(req: Request, res: Response) {
        try {
            const { tournamentId, teamAId, teamBId } = req.body;
            const match = await Match.create({ tournamentId, teamAId, teamBId });
            res.status(201).json(match);
        } catch (error) {
            res.status(500).json({ message: 'Error creating match', error });
        }
    }

    async getMatch(req: Request, res: Response) {
        try {
            const matchId = req.params.id;
            const match = await Match.findById(matchId);
            if (!match) {
                return res.status(404).json({ message: 'Match not found' });
            }
            res.status(200).json(match);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching match', error });
        }
    }

    async updateMatch(req: Request, res: Response) {
        try {
            const matchId = req.params.id;
            const updatedMatch = await Match.findByIdAndUpdate(matchId, req.body, { new: true });
            if (!updatedMatch) {
                return res.status(404).json({ message: 'Match not found' });
            }
            res.status(200).json(updatedMatch);
        } catch (error) {
            res.status(500).json({ message: 'Error updating match', error });
        }
    }

    async deleteMatch(req: Request, res: Response) {
        try {
            const matchId = req.params.id;
            const deletedMatch = await Match.findByIdAndDelete(matchId);
            if (!deletedMatch) {
                return res.status(404).json({ message: 'Match not found' });
            }
            res.status(204).send();
        } catch (error) {
            res.status(500).json({ message: 'Error deleting match', error });
        }
    }

    async getMatchesByTournament(req: Request, res: Response) {
        try {
            const tournamentId = req.params.tournamentId;
            const matches = await Match.find({ tournamentId });
            res.status(200).json(matches);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching matches', error });
        }
    }
}

export default new MatchController();