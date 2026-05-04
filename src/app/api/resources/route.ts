import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import ResourceModel from "@/models/Resource";
import ActivityLogModel from "@/models/ActivityLog";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const { searchParams } = new URL(req.url);
  const subjectId = searchParams.get("subject");
  const filter: Record<string, unknown> = {};
  if (subjectId) filter.subject = subjectId;
  const resources = await ResourceModel.find(filter)
    .populate("subject", "name colorIndex")
    .populate("uploadedBy", "name color gradient")
    .sort({ uploadedAt: -1 });
  return NextResponse.json(resources);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const body = await req.json();
  const resource = await ResourceModel.create({ ...body, uploadedBy: (session.user as any).id });
  await ActivityLogModel.create({
    action: "uploaded_resource",
    user: (session.user as any).id,
    itemId: resource._id,
    itemType: "resource",
    details: `Shared resource "${resource.title}"`,
  });
  return NextResponse.json(resource, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const { id, action, userId } = await req.json();
  if (action === "star") {
    const resource = await ResourceModel.findById(id);
    if (!resource) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const idx = resource.starredBy.indexOf(userId);
    if (idx === -1) resource.starredBy.push(userId);
    else resource.starredBy.splice(idx, 1);
    await resource.save();
    return NextResponse.json(resource);
  }
  const { id: _id, action: _action, userId: _uid, ...body } = await req.json().catch(() => ({ id, action, userId }));
  const resource = await ResourceModel.findByIdAndUpdate(id, body, { new: true });
  return NextResponse.json(resource);
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  await ResourceModel.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}
