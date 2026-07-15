import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import ExamModel from "@/models/Exam";
import MarkModel from "@/models/Mark";
import ActivityLogModel from "@/models/ActivityLog";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const exams = await ExamModel.find({})
    .populate("subject", "name color")
    .populate("createdBy", "name ")
    .sort({ date: -1 });
  const marks = await MarkModel.find({})
    .populate("user", "name color gradient")
    .populate("recordedBy", "name");
  const data = exams.map((e) => ({
    ...e.toObject(),
    marks: marks.filter((m) => m.exam.toString() === e._id.toString()),
  }));
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const body = await req.json();
  const exam = await ExamModel.create({ ...body, createdBy: (session.user as any).id });
  await ActivityLogModel.create({
    action: "created_exam",
    user: (session.user as any).id,
    itemId: exam._id,
    itemType: "exam",
    details: `Added exam "${exam.name}"`,
  });
  return NextResponse.json(exam, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const { id, ...body } = await req.json();
  const exam = await ExamModel.findByIdAndUpdate(id, body, { new: true });
  return NextResponse.json(exam);
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  await ExamModel.findByIdAndDelete(id);
  await MarkModel.deleteMany({ exam: id });
  return NextResponse.json({ success: true });
}
