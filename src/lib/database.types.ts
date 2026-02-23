export type MarketType = "binary" | "multiple" | "numeric";

export interface Pool {
  id: string; slug: string; name: string; description: string | null;
  created_by_name: string; manager_token: string; invite_code: string;
  created_at: string; is_archived: boolean;
}
export interface Member {
  id: string; pool_id: string; name: string; session_token: string; joined_at: string;
}
export interface Market {
  id: string; pool_id: string; question: string; type: MarketType;
  closes_at: string | null; resolved_option_id: string | null;
  resolved_numeric_value: number | null; resolved_at: string | null;
  points_value: number; created_at: string;
}
export interface Option { id: string; market_id: string; label: string; display_order: number; }
export interface Pick { id: string; member_id: string; market_id: string; option_id: string | null; numeric_value: number | null; created_at: string; }
export interface LeaderboardEntry { member_id: string; pool_id: string; name: string; points: number; total_picks: number; }
export interface MarketWithOptions extends Market { options: Option[]; }

export type Database = any;
