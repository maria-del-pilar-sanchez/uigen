// @vitest-environment node
import { describe, test, expect, vi, beforeEach } from "vitest";

// auth.ts is server-only; mock the two Next.js server modules before import
vi.mock("server-only", () => ({}));

const mockCookieStore = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
};

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => mockCookieStore),
}));

// Import after mocks are registered
const { createSession, getSession, deleteSession, verifySession } = await import("@/lib/auth");

// Build a minimal NextRequest-like object with a cookie jar
function makeRequest(cookieValue?: string) {
  return {
    cookies: {
      get: (name: string) =>
        name === "auth-token" && cookieValue ? { value: cookieValue } : undefined,
    },
  } as unknown as import("next/server").NextRequest;
}

describe("createSession", () => {
  beforeEach(() => vi.clearAllMocks());

  test("sets an httpOnly cookie named auth-token", async () => {
    await createSession("user-1", "user@example.com");

    expect(mockCookieStore.set).toHaveBeenCalledOnce();
    const [name, , options] = mockCookieStore.set.mock.calls[0];
    expect(name).toBe("auth-token");
    expect(options.httpOnly).toBe(true);
    expect(options.path).toBe("/");
    expect(options.sameSite).toBe("lax");
  });

  test("cookie value is a JWT string", async () => {
    await createSession("user-1", "user@example.com");

    const token: string = mockCookieStore.set.mock.calls[0][1];
    // JWT format: three base64url segments separated by dots
    expect(token.split(".")).toHaveLength(3);
  });

  test("cookie expires roughly 7 days from now", async () => {
    const before = Date.now();
    await createSession("user-1", "user@example.com");
    const after = Date.now();

    const expires: Date = mockCookieStore.set.mock.calls[0][2].expires;
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    expect(expires.getTime()).toBeGreaterThanOrEqual(before + sevenDaysMs - 1000);
    expect(expires.getTime()).toBeLessThanOrEqual(after + sevenDaysMs + 1000);
  });
});

describe("getSession", () => {
  beforeEach(() => vi.clearAllMocks());

  test("returns null when no cookie is present", async () => {
    mockCookieStore.get.mockReturnValue(undefined);
    const session = await getSession();
    expect(session).toBeNull();
  });

  test("returns null for a malformed token", async () => {
    mockCookieStore.get.mockReturnValue({ value: "not.a.jwt" });
    const session = await getSession();
    expect(session).toBeNull();
  });

  test("returns session payload for a valid token", async () => {
    // Create a real token via createSession, capture it, then feed it back
    await createSession("user-42", "alice@example.com");
    const token: string = mockCookieStore.set.mock.calls[0][1];

    vi.clearAllMocks();
    mockCookieStore.get.mockReturnValue({ value: token });

    const session = await getSession();
    expect(session).not.toBeNull();
    expect(session!.userId).toBe("user-42");
    expect(session!.email).toBe("alice@example.com");
  });

  test("returned session has an expiresAt field", async () => {
    await createSession("user-42", "alice@example.com");
    const token: string = mockCookieStore.set.mock.calls[0][1];

    vi.clearAllMocks();
    mockCookieStore.get.mockReturnValue({ value: token });

    const session = await getSession();
    expect(session!.expiresAt).toBeDefined();
  });
});

describe("deleteSession", () => {
  beforeEach(() => vi.clearAllMocks());

  test("deletes the auth-token cookie", async () => {
    await deleteSession();
    expect(mockCookieStore.delete).toHaveBeenCalledWith("auth-token");
  });
});

describe("verifySession", () => {
  beforeEach(() => vi.clearAllMocks());

  test("returns null when request has no cookie", async () => {
    const session = await verifySession(makeRequest());
    expect(session).toBeNull();
  });

  test("returns null for a malformed token", async () => {
    const session = await verifySession(makeRequest("bad.token.here"));
    expect(session).toBeNull();
  });

  test("returns session payload for a valid token from the request", async () => {
    // Mint a real token
    await createSession("user-99", "bob@example.com");
    const token: string = mockCookieStore.set.mock.calls[0][1];

    const session = await verifySession(makeRequest(token));
    expect(session).not.toBeNull();
    expect(session!.userId).toBe("user-99");
    expect(session!.email).toBe("bob@example.com");
  });

  test("verifySession does not touch the cookie store", async () => {
    await createSession("user-99", "bob@example.com");
    const token: string = mockCookieStore.set.mock.calls[0][1];
    vi.clearAllMocks();

    await verifySession(makeRequest(token));
    expect(mockCookieStore.get).not.toHaveBeenCalled();
    expect(mockCookieStore.set).not.toHaveBeenCalled();
  });
});
