import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/db";
import UserModel from "@/models/User";

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          await connectDB();
          const user = await UserModel.findOne({ email: credentials.email.toLowerCase() });
          if (!user) {
            console.log("NextAuth: User not found in DB");
            return null;
          }

          const isValid = await bcrypt.compare(credentials.password, user.password);
          if (!isValid) {
            console.log("NextAuth: Invalid password");
            return null;
          }

          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            color: user.color,
            gradient: user.gradient,
            avatar: user.avatar,
          };
        } catch (error) {
          console.error("NextAuth Authorize Error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.color = (user as any).color;
        token.gradient = (user as any).gradient;
        token.avatar = (user as any).avatar;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).color = token.color;
        (session.user as any).gradient = token.gradient;
        (session.user as any).avatar = token.avatar;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};
