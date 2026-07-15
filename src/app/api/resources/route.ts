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
  // Exclude heavy fileData from list view
  const resources = await ResourceModel.find(filter)
    .select("-fileData")
    .populate("subject", "name color")
    .populate("uploadedBy", "name color gradient")
    .sort({ uploadedAt: -1 });
  return NextResponse.json(resources);
}

// GET single resource with file data (for download)
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const { id } = await req.json();
  const resource = await ResourceModel.findById(id);
  if (!resource) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(resource);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();

  const contentType = req.headers.get("content-type") ?? "";
  let resourceData: Record<string, unknown> = {};

  if (contentType.includes("multipart/form-data")) {
    // File upload path
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const subject = formData.get("subject") as string;
    const title = formData.get("title") as string;
    const tags = formData.get("tags") as string;

    if (!file || !subject || !title) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check size limit (5 MB for DB storage)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large. Max 5 MB for database storage." }, { status: 413 });
    }

    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");

    // Detect type
    const mime = file.type;
    let type = "other";
    if (mime.startsWith("image/")) type = "image";
    else if (mime === "application/pdf") type = "pdf";
    else if (mime.startsWith("video/")) type = "video";

    resourceData = {
      subject,
      title,
      type,
      fileData: base64,
      fileName: file.name,
      fileMime: mime,
      fileSize: file.size,
      tags: tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
    };
  } else {
    // JSON (link) path
    const body = await req.json();
    resourceData = {
      ...body,
      type: body.type || "link",
    };
  }

  const resource = await ResourceModel.create({
    ...resourceData,
    uploadedBy: (session.user as any).id,
  });

  await ActivityLogModel.create({
    action: "uploaded_resource",
    user: (session.user as any).id,
    itemId: resource._id,
    itemType: "resource",
    details: `Uploaded resource "${resource.title}"`,
  });

  // Return without fileData
  const res = resource.toObject();
  delete res.fileData;
  return NextResponse.json(res, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const body = await req.json();
  const { id, action, userId } = body;

  if (action === "star") {
    const resource = await ResourceModel.findById(id);
    if (!resource) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const idx = resource.starredBy.indexOf(userId);
    if (idx === -1) resource.starredBy.push(userId);
    else resource.starredBy.splice(idx, 1);
    await resource.save();
    return NextResponse.json({ success: true });
  }

  const { id: _id, action: _action, userId: _uid, ...updateBody } = body;
  const resource = await ResourceModel.findByIdAndUpdate(id, updateBody, { new: true }).select("-fileData");
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
