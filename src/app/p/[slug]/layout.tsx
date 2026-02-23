import { createClient } from "@supabase/supabase-js";
import type { Metadata } from "next";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { data: pool } = await supabase.from("pools").select("name,created_by_name").eq("slug", params.slug).single();
  if (!pool) return { title: "Poolside - Predict anything, together" };
  return {
    title: `Join ${pool.created_by_name}'s Pool on Poolside! Lock in your predictions.`,
  };
}

export default function PoolLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
