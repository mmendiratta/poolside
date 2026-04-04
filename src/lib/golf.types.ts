export interface GolfPool {
  id: string;
  pool_id: string;
  deadline: string;
  cut_penalty: number;
  created_at: string;
}

export interface GolfPick {
  id: string;
  member_id: string;
  golf_pool_id: string;
  player_id: string; // references golf-data.ts PLAYER_BY_ID key
  created_at: string;
}

export interface GolfTiebreakerPick {
  id: string;
  member_id: string;
  golf_pool_id: string;
  winning_score: number; // to par, e.g. -11
}

export interface GolfScore {
  player_id: string;
  score_to_par: number | null; // null = not started
  position: string | null;     // "1", "T2", "CUT", "WD"
  thru: string | null;         // "F", "9", "-"
  status: "active" | "cut" | "wd" | "complete";
  updated_at: string;
}

export interface GolfLeaderboardEntry {
  member_id: string;
  name: string;
  total_score: number;        // sum of best 6
  rank: string;               // "1", "T2", etc.
  picks: GolfPickDetail[];
  tiebreaker_score: number | null;
  counting_picks: string[];   // player_ids of the 6 that count
}

export interface GolfPickDetail {
  player_id: string;
  player_name: string;
  tier: number;
  score_to_par: number | null;
  effective_score: number | null; // +cut_penalty if cut
  position: string | null;
  thru: string | null;
  status: string;
  counts: boolean; // is this one of the best 6?
}
