import bcrypt from "bcryptjs";
import connectDB from "../lib/db";
import User from "../models/User";

const users = [
  {
    name: "owais mukri",
    email: "owaishussain259@gmail.com",
    password: "password123",
    color: "#8B5CF6",
    gradient: "from-violet-500 to-purple-600",
  },
  {
    name: "Nofil Shaikh",
    email: "shaikh.nofil.07@gmail.com",
    password: "12345678",
    color: "#3B82F6",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    name: "Kunal Jadhav",
    email: "kunal.j9921@gmail.com",
    password: "12345678",
    color: "#10B981",
    gradient: "from-emerald-500 to-teal-500",
  },
];

async function seed() {
  await connectDB();

  for (const u of users) {
    const existing = await User.findOne({ email: u.email });
    if (existing) {
      console.log(`User ${u.name} already exists — skipping.`);
      continue;
    }
    const hashed = await bcrypt.hash(u.password, 12);
    await User.create({ ...u, password: hashed });
    console.log(`✅ Created user: ${u.name} (${u.email})`);
  }

  console.log("🎉 Seed complete! All 3 users created.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
