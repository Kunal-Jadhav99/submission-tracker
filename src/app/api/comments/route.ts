import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import CommentModel from "@/models/Comment";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const { searchParams } = new URL(req.url);
  const itemId = searchParams.get("itemId");
  const comments = await CommentModel.find({ itemId })
    .populate("user", "name color gradient")
    .populate("replies.user", "name color gradient")
    .sort({ createdAt: 1 });
  return NextResponse.json(comments);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const body = await req.json();
  const userId = (session.user as any).id;
  if (body.replyTo) {
    const comment = await CommentModel.findById(body.replyTo);
    if (!comment) return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    comment.replies.push({ user: userId, text: body.text, mentions: body.mentions ?? [], createdAt: new Date() });
    await comment.save();
    return NextResponse.json(comment);
  }
  const comment = await CommentModel.create({ ...body, user: userId });
  const populated = await comment.populate("user", "name color gradient");
  return NextResponse.json(populated, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  await CommentModel.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}
