export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/assignments/:path*",
    "/tasks/:path*",
    "/exams/:path*",
    "/attendance/:path*",
    "/resources/:path*",
    "/subjects/:path*",
    "/study-sessions/:path*",
    "/syllabus/:path*",
    "/calendar/:path*",
    "/stats/:path*",
    "/activity/:path*",
    "/search/:path*",
  ],
};
