import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import SubmissionModel from "@/models/Submission";
import ActivityLogModel from "@/models/ActivityLog";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const body = await req.json();
  const userId = (session.user as any).id;

  // Toggle submission
  const existing = await SubmissionModel.findOne({ assignment: body.assignmentId, user: userId });
  if (existing) {
    await existing.deleteOne();
    return NextResponse.json({ submitted: false });
  }

  const submission = await SubmissionModel.create({
    assignment: body.assignmentId,
    user: userId,
    isLate: body.isLate ?? false,
    penaltyNote: body.penaltyNote ?? "",
  });
  await ActivityLogModel.create({
    action: "submitted_assignment",
    user: userId,
    itemId: body.assignmentId,
    itemType: "assignment",
    details: body.isLate ? `Submitted assignment (LATE)` : `Submitted assignment`,
  });
  return NextResponse.json({ submitted: true, submission });
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const { id, isLate, penaltyNote } = await req.json();
  const submission = await SubmissionModel.findByIdAndUpdate(id, { isLate, penaltyNote }, { new: true });
  return NextResponse.json(submission);
}
