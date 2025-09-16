class Match {
    constructor(
        public teamA: string,
        public teamB: string,
        public scoreA: number = 0,
        public scoreB: number = 0,
        public status: 'scheduled' | 'in_progress' | 'finished' = 'scheduled'
    ) {}

    updateScore(scoreA: number, scoreB: number): void {
        this.scoreA = scoreA;
        this.scoreB = scoreB;
        this.status = 'finished';
    }

    getMatchResult(): string {
        if (this.scoreA > this.scoreB) {
            return `${this.teamA} wins!`;
        } else if (this.scoreB > this.scoreA) {
            return `${this.teamB} wins!`;
        } else {
            return 'It\'s a draw!';
        }
    }
}