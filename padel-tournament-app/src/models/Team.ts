export class Team {
    name: string;
    players: string[];

    constructor(name: string, players: string[]) {
        this.name = name;
        this.players = players;
    }

    addPlayer(player: string): void {
        this.players.push(player);
    }

    removePlayer(player: string): void {
        this.players = this.players.filter(p => p !== player);
    }

    getPlayers(): string[] {
        return this.players;
    }
}