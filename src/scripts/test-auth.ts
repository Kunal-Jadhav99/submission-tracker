import bcrypt from "bcryptjs";
import connectDB from "../lib/db";
import User from "../models/User";

async function testAuth() {
  await connectDB();
  const user = await User.findOne({ email: "owaishussain259@gmail.com" });
  if (!user) {
    console.log("User not found!");
    process.exit(1);
  }
  
  const isValid = await bcrypt.compare("12345678", user.password);
  console.log(`Password '12345678' is valid? ${isValid}`);
  process.exit(0);
}

testAuth().catch(console.error);
