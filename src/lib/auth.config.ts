import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [], // gevuld in lib/auth.ts (Node runtime)
  callbacks: {
    authorized({ auth, request }) {
      const isAuthed = !!auth?.user;
      const path = request.nextUrl.pathname;
      const isPublic =
        path.startsWith("/login") || path.startsWith("/api/auth");
      if (!isAuthed && !isPublic) {
        const url = new URL("/login", request.nextUrl.origin);
        url.searchParams.set("next", path);
        return Response.redirect(url);
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) token.uid = (user as { id: string }).id;
      return token;
    },
    async session({ session, token }) {
      if (token?.uid && session.user) session.user.id = String(token.uid);
      return session;
    },
  },
} satisfies NextAuthConfig;
