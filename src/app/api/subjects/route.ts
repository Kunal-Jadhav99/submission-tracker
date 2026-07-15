import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import SubjectModel from "@/models/Subject";
import ActivityLogModel from "@/models/ActivityLog";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const subjects = await SubjectModel.find({}).populate("createdBy", "name ").sort({ createdAt: -1 });
  return NextResponse.json(subjects);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const body = await req.json();
  const subject = await SubjectModel.create({ ...body, createdBy: (session.user as any).id });
  await ActivityLogModel.create({
    action: "created_subject",
    user: (session.user as any).id,
    itemId: subject._id,
    itemType: "subject",
    details: `Added subject "${subject.name}"`,
  });
  return NextResponse.json(subject, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const { id, ...body } = await req.json();
  const subject = await SubjectModel.findByIdAndUpdate(id, body, { new: true });
  return NextResponse.json(subject);
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  await SubjectModel.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}
