import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import AttendanceModel from "@/models/Attendance";
import ActivityLogModel from "@/models/ActivityLog";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const { searchParams } = new URL(req.url);
  const subjectId = searchParams.get("subject");
  const userId = searchParams.get("user");
  const filter: Record<string, unknown> = {};
  if (subjectId) filter.subject = subjectId;
  if (userId) filter.user = userId;
  const records = await AttendanceModel.find(filter)
    .populate("user", "name color gradient")
    .populate("subject", "name colorIndex")
    .populate("markedBy", "name")
    .sort({ date: -1 });
  return NextResponse.json(records);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const body = await req.json();
  const userId = (session.user as any).id;
  // Check for duplicate
  const existing = await AttendanceModel.findOne({
    subject: body.subject,
    user: body.user,
    date: new Date(body.date),
  });
  if (existing) {
    existing.status = body.status;
    existing.markedBy = userId;
    await existing.save();
    return NextResponse.json(existing);
  }
  const record = await AttendanceModel.create({ ...body, markedBy: userId });
  await ActivityLogModel.create({
    action: "marked_attendance",
    user: userId,
    itemType: "attendance",
    details: `Marked attendance as ${body.status}`,
  });
  return NextResponse.json(record, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  await AttendanceModel.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}
