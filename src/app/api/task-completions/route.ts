import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import TaskCompletionModel from "@/models/TaskCompletion";
import TaskModel from "@/models/Task";
import UserModel from "@/models/User";
import ActivityLogModel from "@/models/ActivityLog";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();

  const { taskId, userId: targetUserId } = await req.json();
  const markerId = (session.user as any).id; // the person clicking the button

  // If no targetUserId supplied → mark for self
  const forUserId = targetUserId || markerId;

  // Look up task name and both user names for the activity log
  const [task, markerUser, forUser] = await Promise.all([
    TaskModel.findById(taskId).select("name"),
    UserModel.findById(markerId).select("name"),
    UserModel.findById(forUserId).select("name"),
  ]);

  const existing = await TaskCompletionModel.findOne({ task: taskId, user: forUserId });

  if (existing) {
    // Un-complete
    await existing.deleteOne();
    return NextResponse.json({ completed: false });
  }

  // Create completion with markedBy
  const completion = await TaskCompletionModel.create({
    task: taskId,
    user: forUserId,
    markedBy: markerId,
  });

  // Rich activity log entry
  const isSelf = markerId === forUserId || markerId.toString() === forUserId.toString();
  const details = isSelf
    ? `marked task "${task?.name ?? "a task"}" as complete`
    : `marked task "${task?.name ?? "a task"}" as complete for ${forUser?.name ?? "someone"}`;

  await ActivityLogModel.create({
    action: "completed_task",
    user: markerId,
    itemId: taskId,
    itemType: "task",
    details,
    // store extra meta so activity page can show it
    meta: {
      forUserId: forUserId.toString(),
      forUserName: forUser?.name ?? "",
      isSelf,
    },
  });

  return NextResponse.json({ completed: true, completion });
}
