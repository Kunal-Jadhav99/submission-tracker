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
  const userId = (session.user as any).id;

  const filter: Record<string, unknown> = { user: userId };
  if (subjectId) filter.subject = subjectId;

  const records = await AttendanceModel.find(filter)
    .populate("subject", "name color")
    .sort({ date: -1 });
  return NextResponse.json(records);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const body = await req.json();
  const userId = (session.user as any).id;

  // Users can only mark their own attendance
  const existing = await AttendanceModel.findOne({
    subject: body.subjectId,
    user: userId,
    date: new Date(body.date),
  });

  if (existing) {
    existing.status = body.status;
    existing.markedBy = userId;
    existing.note = body.note ?? "";
    await existing.save();
    return NextResponse.json(existing);
  }

  const record = await AttendanceModel.create({
    subject: body.subjectId,
    user: userId,
    date: new Date(body.date),
    status: body.status,
    markedBy: userId,
    note: body.note ?? "",
  });

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
  const userId = (session.user as any).id;
  const id = new URL(req.url).searchParams.get("id");
  // Only delete own records
  await AttendanceModel.findOneAndDelete({ _id: id, user: userId });
  return NextResponse.json({ success: true });
}
