import { NextRequest, NextResponse } from "next/server";

/**
 * Small auth proxy that bridges the browser to the NestJS JWT backend.
 * The refresh token lives in an httpOnly cookie here; the short-lived
 * access token is returned to the client (kept in memory only).
 */

const API =
  process.env.API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:4000/api";

const KINDS: Record<
  "customer" | "admin" | "doctor",
  { base: string; meKey: string; extra: string[] }
> = {
  customer: { base: "/auth", meKey: "user", extra: ["register"] },
  admin: { base: "/admin/auth", meKey: "admin", extra: [] },
  doctor: { base: "/doctors/auth", meKey: "doctor", extra: [] },
};

const REFRESH_DAYS = 30;

function cookieName(kind: string) {
  return `htp_refresh_${kind}`;
}

function setRefreshCookie(res: NextResponse, kind: string, token: string) {
  res.cookies.set(cookieName(kind), token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: REFRESH_DAYS * 24 * 60 * 60,
  });
}

function clearRefreshCookie(res: NextResponse, kind: string) {
  res.cookies.set(cookieName(kind), "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

async function nest(
  path: string,
  init: RequestInit = {},
): Promise<{ ok: boolean; status: number; data: Record<string, unknown> }> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  let data: Record<string, unknown> = {};
  try {
    data = await res.json();
  } catch {
    /* ignore */
  }
  return { ok: res.ok, status: res.status, data };
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const kind = String(body.kind || "");
  const action = String(body.action || "");
  const conf = KINDS[kind as keyof typeof KINDS];
  if (!conf) {
    return NextResponse.json({ error: "Unknown auth kind" }, { status: 400 });
  }

  /* ── login / register ─────────────────────────────────────────── */
  if (
    action === "login" ||
    (action === "register" && conf.extra.includes("register"))
  ) {
    const res = await nest(`${conf.base}/${action}`, {
      method: "POST",
      body: JSON.stringify(body.payload || {}),
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: (res.data.error as string) || "Authentication failed" },
        { status: res.status },
      );
    }
    const { refreshToken, accessToken, ...rest } = res.data;
    const out = NextResponse.json({ success: true, ...rest, accessToken });
    if (typeof refreshToken === "string") {
      setRefreshCookie(out, kind, refreshToken);
    }
    return out;
  }

  /* ── refresh (rotate refresh token, issue new access token) ───── */
  if (action === "refresh") {
    const refreshToken = req.cookies.get(cookieName(kind))?.value;
    if (!refreshToken) {
      return NextResponse.json({ error: "No session" }, { status: 401 });
    }
    const res = await nest(`${conf.base}/refresh`, {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) {
      const out = NextResponse.json(
        { error: (res.data.error as string) || "Session expired" },
        { status: 401 },
      );
      clearRefreshCookie(out, kind);
      return out;
    }
    const { refreshToken: newRefresh, accessToken } = res.data;
    const out = NextResponse.json({ success: true, accessToken });
    if (typeof newRefresh === "string") {
      setRefreshCookie(out, kind, newRefresh);
    }
    return out;
  }

  /* ── bootstrap: refresh + fetch profile in one round trip ─────── */
  if (action === "bootstrap") {
    const refreshToken = req.cookies.get(cookieName(kind))?.value;
    if (!refreshToken) {
      return NextResponse.json({ error: "No session" }, { status: 401 });
    }
    const res = await nest(`${conf.base}/refresh`, {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) {
      const out = NextResponse.json(
        { error: "Session expired" },
        { status: 401 },
      );
      clearRefreshCookie(out, kind);
      return out;
    }
    const { refreshToken: newRefresh, accessToken } = res.data;
    const me = await nest(`${conf.base}/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!me.ok) {
      const out = NextResponse.json(
        { error: "Session expired" },
        { status: 401 },
      );
      clearRefreshCookie(out, kind);
      return out;
    }
    const out = NextResponse.json({
      success: true,
      accessToken,
      [conf.meKey]: me.data[conf.meKey],
    });
    if (typeof newRefresh === "string") {
      setRefreshCookie(out, kind, newRefresh);
    }
    return out;
  }

  /* ── logout: revoke refresh token + clear cookie ──────────────── */
  if (action === "logout") {
    const refreshToken = req.cookies.get(cookieName(kind))?.value;
    if (refreshToken) {
      await nest(`${conf.base}/logout`, {
        method: "POST",
        body: JSON.stringify({ refreshToken }),
      }).catch(() => undefined);
    }
    const out = NextResponse.json({ success: true });
    clearRefreshCookie(out, kind);
    return out;
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
