import { Tournament } from '../models/Tournament';
import { Match } from '../models/Match';

export function generateBracket(teams: string[]): Match[] {
    const matches: Match[] = [];
    const numTeams = teams.length;

    // Calculate the number of rounds needed
    const rounds = Math.ceil(Math.log2(numTeams));

    // Create initial matches
    let matchIndex = 0;
    for (let round = 0; round < rounds; round++) {
        const matchesInRound = Math.pow(2, rounds - round - 1);
        for (let i = 0; i < matchesInRound; i++) {
            const team1Index = i * 2;
            const team2Index = team1Index + 1;

            if (team2Index < numTeams) {
                matches.push(new Match({
                    id: matchIndex++,
                    team1: teams[team1Index],
                    team2: teams[team2Index],
                    score: null,
                    status: 'pending',
                }));
            }
        }
        teams = matches.slice(matchIndex - matchesInRound, matchIndex).map(match => match.winner);
    }

    return matches;
}

export function createTournamentBracket(tournament: Tournament): Match[] {
    const teams = tournament.teams.map(team => team.name);
    return generateBracket(teams);
}