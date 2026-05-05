import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error("Please define MONGODB_URI in .env.local");
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongoose ?? { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    }).then(async (mongoose) => {
      // Import all models to prevent MissingSchemaError during .populate() in serverless environments
      await Promise.all([
        import("@/models/User"),
        import("@/models/Subject"),
        import("@/models/Assignment"),
        import("@/models/Submission"),
        import("@/models/Task"),
        import("@/models/TaskCompletion"),
        import("@/models/Exam"),
        import("@/models/Mark"),
        import("@/models/Attendance"),
        import("@/models/Resource"),
        import("@/models/StudySession"),
        import("@/models/Syllabus"),
        import("@/models/RevisionTopic"),
        import("@/models/Comment"),
        import("@/models/ActivityLog"),
        import("@/models/Practical"),
        import("@/models/PracticalSubmission"),
        import("@/models/Timetable"),
      ]).catch(e => console.error("Error pre-loading models:", e));
      return mongoose;
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

export default connectDB;
