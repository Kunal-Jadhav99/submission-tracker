import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import RevisionTopicModel from "@/models/RevisionTopic";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const { searchParams } = new URL(req.url);
  const subjectId = searchParams.get("subject");
  const filter: Record<string, unknown> = {};
  if (subjectId) filter.subject = subjectId;
  const topics = await RevisionTopicModel.find(filter)
    .populate("subject", "name color")
    .populate("user", "name color gradient")
    .sort({ createdAt: -1 });
  return NextResponse.json(topics);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const body = await req.json();
  const topic = await RevisionTopicModel.create({ ...body, user: (session.user as any).id });
  return NextResponse.json(topic, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const { id, status, revisionRounds } = await req.json();
  const update: Record<string, unknown> = { updatedAt: new Date() };
  if (status !== undefined) update.status = status;
  if (revisionRounds !== undefined) update.revisionRounds = revisionRounds;
  const topic = await RevisionTopicModel.findByIdAndUpdate(id, update, { new: true });
  return NextResponse.json(topic);
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const { searchParams } = new URL(req.url);
  await RevisionTopicModel.findByIdAndDelete(searchParams.get("id"));
  return NextResponse.json({ success: true });
}
