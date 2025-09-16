import { Request, Response } from 'express';
import { Player } from '../models/Player';
import { Club } from '../models/Club';

export class PlayerController {
    private players: Player[] = [];

    public registerPlayer(req: Request, res: Response): void {
        const { name, age, clubId } = req.body;
        const newPlayer = new Player(name, age, clubId);
        this.players.push(newPlayer);
        res.status(201).json(newPlayer);
    }

    public getPlayers(req: Request, res: Response): void {
        res.status(200).json(this.players);
    }

    public getPlayerById(req: Request, res: Response): void {
        const playerId = req.params.id;
        const player = this.players.find(p => p.id === playerId);
        if (player) {
            res.status(200).json(player);
        } else {
            res.status(404).json({ message: 'Player not found' });
        }
    }

    public getPlayersByClub(req: Request, res: Response): void {
        const clubId = req.params.clubId;
        const playersInClub = this.players.filter(p => p.clubId === clubId);
        res.status(200).json(playersInClub);
    }
}