import "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    color: string;
    gradient: string;
    avatar?: string;
  }
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      color: string;
      gradient: string;
      avatar?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    color: string;
    gradient: string;
    avatar?: string;
  }
}
