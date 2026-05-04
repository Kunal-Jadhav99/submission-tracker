import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import SyllabusModel from "@/models/Syllabus";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const { searchParams } = new URL(req.url);
  const subjectId = searchParams.get("subject");
  const filter: Record<string, unknown> = {};
  if (subjectId) filter.subject = subjectId;
  const syllabi = await SyllabusModel.find(filter)
    .populate("subject", "name colorIndex")
    .populate("uploadedBy", "name color");
  return NextResponse.json(syllabi);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const body = await req.json();
  const userId = (session.user as any).id;
  const existing = await SyllabusModel.findOne({ subject: body.subject });
  if (existing) {
    const updated = await SyllabusModel.findByIdAndUpdate(existing._id, { ...body, uploadedBy: userId }, { new: true });
    return NextResponse.json(updated);
  }
  const syllabus = await SyllabusModel.create({ ...body, uploadedBy: userId });
  return NextResponse.json(syllabus, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const { id, topicId, completed } = await req.json();
  const userId = (session.user as any).id;
  const syllabus = await SyllabusModel.findById(id);
  if (!syllabus) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const topic = syllabus.topics.id(topicId);
  if (topic) {
    topic.completed = completed;
    topic.completedBy = completed ? userId : undefined;
    topic.completedAt = completed ? new Date() : undefined;
  }
  await syllabus.save();
  return NextResponse.json(syllabus);
}
