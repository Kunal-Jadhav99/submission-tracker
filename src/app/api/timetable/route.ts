import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import TimetableModel from "@/models/Timetable";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const entries = await TimetableModel.find({})
    .populate("subject", "name colorIndex")
    .sort({ dayOfWeek: 1, period: 1 });
  return NextResponse.json(entries);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const body = await req.json();
  // Upsert: if same day+period exists, update it
  const entry = await TimetableModel.findOneAndUpdate(
    { dayOfWeek: body.dayOfWeek, period: body.period },
    body,
    { upsert: true, new: true }
  );
  return NextResponse.json(entry, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const id = new URL(req.url).searchParams.get("id");
  await TimetableModel.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}
