export const ERROR_MESSAGES = {
    TOURNAMENT_NOT_FOUND: "Torneo no encontrado.",
    CLUB_NOT_FOUND: "Club no encontrado.",
    PLAYER_NOT_FOUND: "Jugador no encontrado.",
    MATCH_NOT_FOUND: "Partido no encontrado.",
    INVALID_INPUT: "Entrada no válida.",
    UNAUTHORIZED: "No autorizado.",
};

export const DEFAULT_TOURNAMENT_SETTINGS = {
    MAX_TEAMS: 64,
    MIN_TEAMS: 4,
    FORMAT: "eliminatorias",
    SCORING_SYSTEM: "suma 11",
};

export const SCORING_RULES = {
    SUMA_7: "suma 7",
    SUMA_11: "suma 11",
};

export const TOURNAMENT_STATUSES = {
    SCHEDULED: "programado",
    IN_PROGRESS: "en progreso",
    COMPLETED: "completado",
};