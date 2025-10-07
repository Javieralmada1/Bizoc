export interface PlayerProfile {
  id: string;
  first_name: string;
  last_name: string;
  category: string;
  // Agrega cualquier otro campo que tengas en tu tabla `player_profiles`
}

export interface Match {
  id: number;
  match_date: string;
  court_id: number;
  team1_id: number;
  team2_id: number;
  teams1?: { players: { first_name: string, last_name: string }, players2?: { first_name: string, last_name: string } };
  teams2?: { players: { first_name: string, last_name: string }, players2?: { first_name: string, last_name: string } };
  courts?: { name: string };
}

export interface Reservation {
  id: number;
  start_time: string;
  end_time: string;
  court_id: number;
  player_id: string;
  club_id: number;
  courts?: { name: string };
  clubs?: { name: string };
}

export interface Tournament {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  club_id: number;
  clubs?: { name: string };
}
