import { NextResponse } from "next/server";
import { presetVoices } from "@/lib/voices";

export async function GET() {
  return NextResponse.json({ voices: presetVoices });
}
