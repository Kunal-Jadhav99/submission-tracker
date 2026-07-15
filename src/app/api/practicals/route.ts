import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import PracticalModel from "@/models/Practical";
import PracticalSubmissionModel from "@/models/PracticalSubmission";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const { searchParams } = new URL(req.url);
  const subjectId = searchParams.get("subject");
  const filter: Record<string, unknown> = {};
  if (subjectId) filter.subject = subjectId;
  const practicals = await PracticalModel.find(filter)
    .populate("subject", "name color")
    .populate("createdBy", "name")
    .sort({ dueDate: 1 });
  const submissions = await PracticalSubmissionModel.find({}).populate("user", "name color gradient");
  const data = practicals.map((p) => ({
    ...p.toObject(),
    submissions: submissions.filter((s) => s.practical.toString() === p._id.toString()),
  }));
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const body = await req.json();
  const practical = await PracticalModel.create({ ...body, createdBy: (session.user as any).id });
  return NextResponse.json(practical, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const { id, ...body } = await req.json();
  const practical = await PracticalModel.findByIdAndUpdate(id, body, { new: true });
  return NextResponse.json(practical);
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const id = new URL(req.url).searchParams.get("id");
  await PracticalModel.findByIdAndDelete(id);
  await PracticalSubmissionModel.deleteMany({ practical: id });
  return NextResponse.json({ success: true });
}
