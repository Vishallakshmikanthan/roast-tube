import NextAuth, { type NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

export const authConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      authorization: {
        params: {
          scope: "openid profile https://www.googleapis.com/auth/youtube.readonly",
          prompt: "select_account",
          // deliberately NO access_type=offline: we never get a refresh token
        },
      },
    }),
  ],
  session: { strategy: "jwt", maxAge: 60 * 60 }, // matches access token lifetime (1 hour)
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        // only populated at sign-in
        token.accessToken = account.access_token; // stays inside the encrypted JWT cookie
        token.googleSub = (profile?.sub as string) ?? token.sub;
        token.firstName =
          (profile?.given_name as string) ?? token.name?.split(" ")[0] ?? "Anon";
      }
      return token;
    },
    async session({ session, token }) {
      // NEVER copy accessToken into the session object (it is readable by the client)
      if (session.user) {
        session.user.googleSub = token.googleSub as string;
        session.user.firstName = token.firstName as string;
      }
      return session;
    },
  },
  pages: { signIn: "/" },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
