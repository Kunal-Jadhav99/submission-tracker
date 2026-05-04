import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import StudySessionModel from "@/models/StudySession";
import ActivityLogModel from "@/models/ActivityLog";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const sessions = await StudySessionModel.find({})
    .populate("subject", "name colorIndex")
    .populate("createdBy", "name color gradient")
    .populate("attendees", "name color gradient")
    .sort({ scheduledDate: 1 });
  return NextResponse.json(sessions);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const body = await req.json();
  const userId = (session.user as any).id;
  const studySession = await StudySessionModel.create({ ...body, createdBy: userId });
  await ActivityLogModel.create({
    action: "created_study_session",
    user: userId,
    itemId: studySession._id,
    itemType: "study_session",
    details: `Scheduled study session "${studySession.title}"`,
  });
  return NextResponse.json(studySession, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const { id, ...body } = await req.json();
  const updated = await StudySessionModel.findByIdAndUpdate(id, body, { new: true });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const { searchParams } = new URL(req.url);
  await StudySessionModel.findByIdAndDelete(searchParams.get("id"));
  return NextResponse.json({ success: true });
}
