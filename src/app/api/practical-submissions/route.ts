import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import PracticalSubmissionModel from "@/models/PracticalSubmission";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const { practicalId, marksObtained, isLate } = await req.json();
  const userId = (session.user as any).id;

  const existing = await PracticalSubmissionModel.findOne({ practical: practicalId, user: userId });
  if (existing) {
    await PracticalSubmissionModel.findByIdAndDelete(existing._id);
    return NextResponse.json({ removed: true });
  }

  const sub = await PracticalSubmissionModel.create({ practical: practicalId, user: userId, marksObtained, isLate: isLate ?? false });
  return NextResponse.json(sub, { status: 201 });
}
