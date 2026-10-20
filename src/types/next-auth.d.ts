import { DefaultSession } from "next-auth";
import { JWT as DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      googleSub?: string;
      firstName?: string;
    } & DefaultSession["user"];
  }

  interface User {
    googleSub?: string;
    firstName?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    googleSub?: string;
    firstName?: string;
  }
}
