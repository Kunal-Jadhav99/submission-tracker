import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import TaskModel from "@/models/Task";
import TaskCompletionModel from "@/models/TaskCompletion";
import ActivityLogModel from "@/models/ActivityLog";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const tasks = await TaskModel.find({})
    .populate("createdBy", "name color gradient")
    .populate("subTasks.assignedTo", "name color")
    .sort({ deadline: 1 });
  const completions = await TaskCompletionModel.find({})
    .populate("user", "name color gradient")
    .populate("markedBy", "name color gradient");
  const data = tasks.map((t) => ({
    ...t.toObject(),
    completions: completions.filter((c) => c.task.toString() === t._id.toString()),
  }));
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const body = await req.json();
  const task = await TaskModel.create({ ...body, createdBy: (session.user as any).id });
  await ActivityLogModel.create({
    action: "created_task",
    user: (session.user as any).id,
    itemId: task._id,
    itemType: "task",
    details: `Added task "${task.name}"`,
  });
  return NextResponse.json(task, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const { id, ...body } = await req.json();
  const task = await TaskModel.findByIdAndUpdate(id, body, { new: true });
  return NextResponse.json(task);
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  await TaskModel.findByIdAndDelete(id);
  await TaskCompletionModel.deleteMany({ task: id });
  return NextResponse.json({ success: true });
}
