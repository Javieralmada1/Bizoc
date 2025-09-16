import { Request, Response } from 'express';
import { Club } from '../models/Club';

export class ClubController {
    private clubs: Club[] = [];

    public registerClub(req: Request, res: Response): void {
        const { name, location } = req.body;
        const newClub = new Club(name, location);
        this.clubs.push(newClub);
        res.status(201).json({ message: 'Club registered successfully', club: newClub });
    }

    public getClubs(req: Request, res: Response): void {
        res.status(200).json(this.clubs);
    }

    public getClubById(req: Request, res: Response): void {
        const clubId = req.params.id;
        const club = this.clubs.find(c => c.id === clubId);
        if (club) {
            res.status(200).json(club);
        } else {
            res.status(404).json({ message: 'Club not found' });
        }
    }
}