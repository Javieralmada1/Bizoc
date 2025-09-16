class Tournament {
    name: string;
    date: Date;
    teams: string[];
    format: string;
    rounds: string[];

    constructor(name: string, date: Date, teams: string[], format: string) {
        this.name = name;
        this.date = date;
        this.teams = teams;
        this.format = format;
        this.rounds = [];
    }

    generateRounds() {
        // Logic to generate tournament rounds based on the number of teams and format
        const numberOfTeams = this.teams.length;
        if (numberOfTeams < 2) {
            throw new Error("Not enough teams to generate rounds.");
        }

        // Example logic for generating rounds
        let roundCount = Math.ceil(Math.log2(numberOfTeams));
        for (let i = 0; i < roundCount; i++) {
            this.rounds.push(`Round ${i + 1}`);
        }
    }

    getTournamentDetails() {
        return {
            name: this.name,
            date: this.date,
            teams: this.teams,
            format: this.format,
            rounds: this.rounds,
        };
    }
}