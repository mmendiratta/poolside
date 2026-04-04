import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { generateSlug } from "@/lib/utils";
import { DEADLINE, CUT_PENALTY } from "@/lib/golf-data";

export async function POST(req: NextRequest) {
  try {
    const { name, description, createdByName } = await req.json();
    if (!name?.trim() || !createdByName?.trim())
      return NextResponse.json({ error: "name and createdByName required" }, { status: 400 });

    // Create base pool
    const slug = generateSlug(name);
    const { data: pool, error: poolError } = await supabaseAdmin
      .from("pools")
      .insert({ slug, name: name.trim(), description: description?.trim() || null, created_by_name: createdByName.trim() })
      .select()
      .single();
    if (poolError || !pool)
      return NextResponse.json({ error: "Failed to create pool" }, { status: 500 });

    // Create golf pool record
    const { data: golfPool, error: golfError } = await supabaseAdmin
      .from("golf_pools")
      .insert({ pool_id: pool.id, deadline: DEADLINE, cut_penalty: CUT_PENALTY })
      .select()
      .single();
    if (golfError || !golfPool) {
      console.error(golfError);
      return NextResponse.json({ error: "Failed to create golf pool" }, { status: 500 });
    }

    return NextResponse.json({
      slug: pool.slug,
      poolId: pool.id,
      golfPoolId: golfPool.id,
      managerToken: pool.manager_token,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
