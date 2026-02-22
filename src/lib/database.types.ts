export type PoolType = "binary" | "multiple" | "numeric";

export interface Event {
  id: string; slug: string; name: string; description: string | null;
  created_by_name: string; manager_token: string; created_at: string; is_archived: boolean;
}
export interface Pool {
  id: string; event_id: string; question: string; type: PoolType;
  closes_at: string | null; resolved_option_id: string | null;
  resolved_numeric_value: number | null; resolved_at: string | null;
  points_value: number; created_at: string;
}
export interface Option { id: string; pool_id: string; label: string; display_order: number; }
export interface Participant { id: string; event_id: string; name: string; session_token: string; joined_at: string; }
export interface Pick { id: string; participant_id: string; pool_id: string; option_id: string | null; numeric_value: number | null; created_at: string; }
export interface LeaderboardEntry { participant_id: string; event_id: string; name: string; points: number; total_picks: number; }
export interface PoolWithOptions extends Pool { options: Option[]; }
export interface EventWithPools extends Event { pools: PoolWithOptions[]; }

export type Database = {
  public: {
    Tables: {
      events: { Row: Event; Insert: Omit<Event, "id"|"manager_token"|"created_at"|"is_archived">; Update: Partial<Event> };
      pools: { Row: Pool; Insert: Omit<Pool, "id"|"created_at">; Update: Partial<Pool> };
      options: { Row: Option; Insert: Omit<Option, "id">; Update: Partial<Option> };
      participants: { Row: Participant; Insert: Omit<Participant, "id"|"session_token"|"joined_at">; Update: Partial<Participant> };
      picks: { Row: Pick; Insert: Omit<Pick, "id"|"created_at">; Update: Partial<Pick> };
    };
    Views: { leaderboard: { Row: LeaderboardEntry } };
  };
};
