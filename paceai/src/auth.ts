import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

/**
 * Auth.js (NextAuth v5) configuration.
 *
 * Ships with a demo credentials provider so the product is explorable
 * without infrastructure. For production:
 *  - add OAuth providers (Google, Strava…) here,
 *  - set AUTH_SECRET,
 *  - enable the Prisma adapter once DATABASE_URL is configured:
 *      adapter: PrismaAdapter(getPrisma()!)
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET ?? "paceai-dev-secret-change-me",
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      name: "Demo",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        // Demo mode: any email works. Replace with a bcrypt check against
        // User.passwordHash when the database is enabled.
        const email = typeof credentials?.email === "string" ? credentials.email : "";
        if (!email.includes("@")) return null;
        return { id: "demo-user", name: email.split("@")[0], email };
      },
    }),
  ],
});
