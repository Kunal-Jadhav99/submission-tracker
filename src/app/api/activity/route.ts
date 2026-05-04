import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import ActivityLogModel from "@/models/ActivityLog";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") ?? "50");
  const logs = await ActivityLogModel.find({})
    .populate("user", "name color gradient")
    .sort({ createdAt: -1 })
    .limit(limit);
  return NextResponse.json(logs);
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const { id, emoji } = await req.json();
  const userId = (session.user as any).id;
  const log = await ActivityLogModel.findById(id);
  if (!log) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!log.reactions) log.reactions = [];
  const reaction = log.reactions.find((r: any) => r.emoji === emoji);
  if (reaction) {
    const idx = reaction.users.indexOf(userId);
    if (idx === -1) reaction.users.push(userId);
    else reaction.users.splice(idx, 1);
  } else {
    log.reactions.push({ emoji, users: [userId] });
  }
  await log.save();
  return NextResponse.json(log);
}
