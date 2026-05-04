import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import TaskCompletionModel from "@/models/TaskCompletion";
import ActivityLogModel from "@/models/ActivityLog";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const { taskId } = await req.json();
  const userId = (session.user as any).id;
  const existing = await TaskCompletionModel.findOne({ task: taskId, user: userId });
  if (existing) {
    await existing.deleteOne();
    return NextResponse.json({ completed: false });
  }
  const completion = await TaskCompletionModel.create({ task: taskId, user: userId });
  await ActivityLogModel.create({
    action: "completed_task",
    user: userId,
    itemId: taskId,
    itemType: "task",
    details: `Marked task as complete`,
  });
  return NextResponse.json({ completed: true, completion });
}
