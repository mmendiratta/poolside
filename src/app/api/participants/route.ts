import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  try {
    const { eventId, name } = await req.json();
    if (!eventId || !name?.trim()) return NextResponse.json({ error: "eventId and name required" }, { status: 400 });
    const { data: event } = await supabaseAdmin.from("events").select("id").eq("id", eventId).single();
    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });
    const { data: participant, error } = await supabaseAdmin.from("participants").upsert({ event_id: eventId, name: name.trim() }, { onConflict: "event_id,name", ignoreDuplicates: false }).select().single();
    if (error || !participant) { console.error(error); return NextResponse.json({ error: "Failed to join event" }, { status: 500 }); }
    return NextResponse.json({ participantId: participant.id, sessionToken: participant.session_token, name: participant.name });
  } catch (err) { console.error(err); return NextResponse.json({ error: "Internal server error" }, { status: 500 }); }
}
