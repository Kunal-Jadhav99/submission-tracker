import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import MarkModel from "@/models/Mark";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const { examId, userId, score } = await req.json();
  const existing = await MarkModel.findOne({ exam: examId, user: userId });
  if (existing) {
    existing.score = score;
    existing.recordedBy = (session.user as any).id;
    existing.recordedAt = new Date();
    await existing.save();
    return NextResponse.json(existing);
  }
  const mark = await MarkModel.create({
    exam: examId,
    user: userId,
    score,
    recordedBy: (session.user as any).id,
  });
  return NextResponse.json(mark, { status: 201 });
}
