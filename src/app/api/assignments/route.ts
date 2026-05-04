import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import AssignmentModel from "@/models/Assignment";
import SubmissionModel from "@/models/Submission";
import ActivityLogModel from "@/models/ActivityLog";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const { searchParams } = new URL(req.url);
  const subjectId = searchParams.get("subject");
  const filter: Record<string, unknown> = {};
  if (subjectId) filter.subject = subjectId;
  const assignments = await AssignmentModel.find(filter)
    .populate("subject", "name colorIndex")
    .populate("createdBy", "name color gradient")
    .sort({ dueDate: 1 });
  const submissions = await SubmissionModel.find({}).populate("user", "name color gradient");
  const data = assignments.map((a) => ({
    ...a.toObject(),
    submissions: submissions.filter((s) => s.assignment.toString() === a._id.toString()),
  }));
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const body = await req.json();
  const assignment = await AssignmentModel.create({ ...body, createdBy: (session.user as any).id });
  await ActivityLogModel.create({
    action: "created_assignment",
    user: (session.user as any).id,
    itemId: assignment._id,
    itemType: "assignment",
    details: `Added assignment "${assignment.title}"`,
  });
  const populated = await assignment.populate(["subject", "createdBy"]);
  return NextResponse.json(populated, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const { id, ...body } = await req.json();
  const assignment = await AssignmentModel.findByIdAndUpdate(id, body, { new: true })
    .populate("subject", "name colorIndex")
    .populate("createdBy", "name color gradient");
  return NextResponse.json(assignment);
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  await AssignmentModel.findByIdAndDelete(id);
  await SubmissionModel.deleteMany({ assignment: id });
  return NextResponse.json({ success: true });
}
