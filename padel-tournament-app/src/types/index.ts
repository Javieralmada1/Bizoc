export interface Tournament {
    id: string;
    name: string;
    date: Date;
    teams: Team[];
    format: 'single-elimination' | 'double-elimination' | 'round-robin';
}

export interface Club {
    id: string;
    name: string;
    location: string;
    players: Player[];
}

export interface Player {
    id: string;
    name: string;
    age: number;
    clubId: string;
}

export interface Team {
    id: string;
    name: string;
    players: Player[];
}

export interface Match {
    id: string;
    teamA: Team;
    teamB: Team;
    scoreA: number;
    scoreB: number;
    status: 'scheduled' | 'in-progress' | 'completed';
}

export interface TournamentRequest {
    name: string;
    date: Date;
    teams: string[]; // Array of team IDs
    format: 'single-elimination' | 'double-elimination' | 'round-robin';
}

export interface TournamentResponse {
    tournament: Tournament;
    message: string;
}

export interface ClubRequest {
    name: string;
    location: string;
}

export interface ClubResponse {
    club: Club;
    message: string;
}

export interface PlayerRequest {
    name: string;
    age: number;
    clubId: string;
}

export interface PlayerResponse {
    player: Player;
    message: string;
}

export interface MatchRequest {
    teamAId: string;
    teamBId: string;
}

export interface MatchResponse {
    match: Match;
    message: string;
}