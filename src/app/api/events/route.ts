import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { generateSlug } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const { name, description, createdByName, pools } = await req.json();
    if (!name?.trim() || !createdByName?.trim()) return NextResponse.json({ error: "name and createdByName required" }, { status: 400 });
    const slug = generateSlug(name);
    const { data: event, error: eventError } = await supabaseAdmin.from("events").insert({ slug, name: name.trim(), description: description?.trim()||null, created_by_name: createdByName.trim() }).select().single();
    if (eventError || !event) { console.error(eventError); return NextResponse.json({ error: "Failed to create event" }, { status: 500 }); }
    for (const pool of pools??[]) {
      const { data: createdPool, error: poolError } = await supabaseAdmin.from("pools").insert({ event_id: event.id, question: pool.question.trim(), type: pool.type, closes_at: pool.closesAt||null, points_value: pool.pointsValue??100 }).select().single();
      if (poolError || !createdPool) { console.error(poolError); continue; }
      if (pool.type!=="numeric" && pool.options?.length>0) {
        const optionRows = pool.options.filter((o: string)=>o.trim()).map((label: string, i: number) => ({ pool_id: createdPool.id, label: label.trim(), display_order: i }));
        if (optionRows.length>0) await supabaseAdmin.from("options").insert(optionRows);
      }
    }
    return NextResponse.json({ slug: event.slug, managerId: event.id, managerToken: event.manager_token });
  } catch (err) { console.error(err); return NextResponse.json({ error: "Internal server error" }, { status: 500 }); }
}
