import connectDB from "../lib/db";
import User from "../models/User";

async function resetUsers() {
  await connectDB();
  await User.deleteMany({});
  console.log("Deleted all users from the database.");
  process.exit(0);
}

resetUsers().catch((err) => {
  console.error(err);
  process.exit(1);
});
