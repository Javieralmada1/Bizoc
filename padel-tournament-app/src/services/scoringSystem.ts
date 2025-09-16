export const calculateScore = (points: number, rule: 'suma7' | 'suma11'): number => {
    if (rule === 'suma7') {
        return points % 7;
    } else if (rule === 'suma11') {
        return points % 11;
    }
    throw new Error('Invalid scoring rule');
};

export const updateMatchScore = (matchId: string, teamScores: { [teamId: string]: number }): void => {
    // Logic to update the match score in the database
    // This function would typically interact with the Match model to save scores
};

export const getMatchScore = (matchId: string): { [teamId: string]: number } => {
    // Logic to retrieve the match score from the database
    // This function would typically interact with the Match model to fetch scores
    return {};
};