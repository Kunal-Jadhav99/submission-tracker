import connectDB from "../lib/db";
import User from "../models/User";

async function check() {
  await connectDB();
  const users = await User.find({});
  console.log("Users in DB:");
  users.forEach(u => console.log(u.email, u.name));
  process.exit(0);
}

check().catch(console.error);
