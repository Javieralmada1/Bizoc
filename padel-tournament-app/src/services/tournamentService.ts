import { Tournament } from '../models/Tournament';
import { Team } from '../models/Team';
import { Match } from '../models/Match';
import { generateBracket } from './bracketGenerator';
import { calculateScore } from './scoringSystem';

export class TournamentService {
    private tournaments: Tournament[] = [];

    createTournament(name: string, date: Date, teams: Team[]): Tournament {
        const tournament = new Tournament(name, date, teams);
        this.tournaments.push(tournament);
        tournament.bracket = generateBracket(teams.length);
        return tournament;
    }

    getTournaments(): Tournament[] {
        return this.tournaments;
    }

    recordMatch(tournamentId: string, match: Match): void {
        const tournament = this.tournaments.find(t => t.id === tournamentId);
        if (tournament) {
            tournament.matches.push(match);
            calculateScore(match);
        }
    }

    getTournamentDetails(tournamentId: string): Tournament | undefined {
        return this.tournaments.find(t => t.id === tournamentId);
    }
}