class Club {
    name: string;
    location: string;
    players: string[];

    constructor(name: string, location: string) {
        this.name = name;
        this.location = location;
        this.players = [];
    }

    addPlayer(playerId: string): void {
        this.players.push(playerId);
    }

    removePlayer(playerId: string): void {
        this.players = this.players.filter(player => player !== playerId);
    }

    getPlayers(): string[] {
        return this.players;
    }
}