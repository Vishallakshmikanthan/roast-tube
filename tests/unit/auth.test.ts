import { describe, it, expect, vi, beforeEach } from "vitest";
import { authConfig } from "@/lib/auth";
import { getAccessToken } from "@/lib/token";
import type { NextRequest } from "next/server";
import * as jwtModule from "next-auth/jwt";

describe("Module 1: Authentication Configuration & Acceptance Criteria", () => {
  it("requests only youtube.readonly and identity scopes", () => {
    const rawProvider = authConfig.providers[0] as any;
    expect(rawProvider).toBeDefined();

    const providerObj = typeof rawProvider === "function" ? rawProvider() : rawProvider;
    const authParams =
      providerObj.options?.authorization?.params ??
      providerObj.authorization?.params;

    expect(authParams).toBeDefined();
    expect(authParams.scope).toBe(
      "openid profile https://www.googleapis.com/auth/youtube.readonly"
    );
    expect(authParams.prompt).toBe("select_account");
    // Verify NO offline access is requested (we do not store refresh tokens)
    expect(authParams.access_type).toBeUndefined();
  });

  it("configures session with JWT strategy and 1-hour maxAge", () => {
    expect(authConfig.session?.strategy).toBe("jwt");
    expect(authConfig.session?.maxAge).toBe(3600); // 60 * 60 seconds
  });

  describe("authConfig.callbacks.jwt", () => {
    const jwtCallback = authConfig.callbacks?.jwt;

    it("extracts accessToken, googleSub, and firstName on initial sign-in", async () => {
      expect(jwtCallback).toBeDefined();
      if (!jwtCallback) return;

      const mockAccount: any = {
        access_token: "mock-google-yt-access-token-12345",
      };
      const mockProfile: any = {
        sub: "google-sub-98765",
        given_name: "Vishal",
      };
      const initialToken: any = {};

      const result = await jwtCallback({
        token: initialToken,
        account: mockAccount,
        profile: mockProfile,
        user: {} as any,
        trigger: "signIn",
      });

      expect(result).not.toBeNull();
      expect(result?.accessToken).toBe("mock-google-yt-access-token-12345");
      expect(result?.googleSub).toBe("google-sub-98765");
      expect(result?.firstName).toBe("Vishal");
    });

    it("falls back to first name from token.name if given_name is absent", async () => {
      if (!jwtCallback) return;

      const mockAccount: any = { access_token: "yt-token" };
      const mockProfile: any = { sub: "sub-1" };
      const initialToken: any = { name: "Gordon Ramsay" };

      const result = await jwtCallback({
        token: initialToken,
        account: mockAccount,
        profile: mockProfile,
        user: {} as any,
        trigger: "signIn",
      });

      expect(result).not.toBeNull();
      expect(result?.firstName).toBe("Gordon");
    });

    it("does not overwrite token when account is not present (subsequent requests)", async () => {
      if (!jwtCallback) return;

      const existingToken: any = {
        accessToken: "stored-token",
        googleSub: "sub-123",
        firstName: "Test",
      };

      const result = await jwtCallback({
        token: existingToken,
        user: {} as any,
        account: null,
        trigger: "update",
      });

      expect(result).not.toBeNull();
      expect(result?.accessToken).toBe("stored-token");
      expect(result?.googleSub).toBe("sub-123");
      expect(result?.firstName).toBe("Test");
    });
  });

  describe("authConfig.callbacks.session (Zero Token Exposure in Session)", () => {
    const sessionCallback = authConfig.callbacks?.session;

    it("NEVER leaks the accessToken into the session object", async () => {
      expect(sessionCallback).toBeDefined();
      if (!sessionCallback) return;

      const mockToken: any = {
        accessToken: "SUPER_SECRET_YOUTUBE_TOKEN",
        googleSub: "google-sub-001",
        firstName: "Vishal",
      };

      const initialSession: any = {
        user: {
          name: "Vishal L",
          email: "vishal@example.com",
        },
        expires: new Date(Date.now() + 3600000).toISOString(),
      };

      const finalSession = await sessionCallback({
        session: initialSession,
        token: mockToken,
        user: {} as any,
        newSession: undefined,
        trigger: "update",
      });

      // Verify user fields are populated
      expect((finalSession.user as any).googleSub).toBe("google-sub-001");
      expect((finalSession.user as any).firstName).toBe("Vishal");

      // CRITICAL ACCEPTANCE CRITERIA: No token leakage
      expect((finalSession as any).accessToken).toBeUndefined();
      expect((finalSession.user as any).accessToken).toBeUndefined();
      expect(JSON.stringify(finalSession)).not.toContain("SUPER_SECRET_YOUTUBE_TOKEN");
    });
  });

  describe("getAccessToken helper", () => {
    beforeEach(() => {
      vi.restoreAllMocks();
      process.env.AUTH_SECRET = "test-secret-min-32-chars-long-123456789";
    });

    it("returns accessToken from encrypted JWT cookie", async () => {
      vi.spyOn(jwtModule, "getToken").mockResolvedValueOnce({
        accessToken: "valid-server-access-token",
      } as any);

      const mockReq = {
        nextUrl: { protocol: "http:" },
      } as unknown as NextRequest;

      const token = await getAccessToken(mockReq);
      expect(token).toBe("valid-server-access-token");
    });

    it("returns null when no token is found in request", async () => {
      vi.spyOn(jwtModule, "getToken").mockResolvedValueOnce(null);

      const mockReq = {
        nextUrl: { protocol: "http:" },
      } as unknown as NextRequest;

      const token = await getAccessToken(mockReq);
      expect(token).toBeNull();
    });

    it("returns null if AUTH_SECRET is not set", async () => {
      const orig = process.env.AUTH_SECRET;
      delete process.env.AUTH_SECRET;

      const mockReq = {
        nextUrl: { protocol: "http:" },
      } as unknown as NextRequest;

      const token = await getAccessToken(mockReq);
      expect(token).toBeNull();

      process.env.AUTH_SECRET = orig;
    });
  });
});
