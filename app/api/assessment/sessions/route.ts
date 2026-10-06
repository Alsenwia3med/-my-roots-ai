import { NextResponse } from "next/server";
import { createSession, setSessionEmail, SESSION_TTL_SECONDS } from "@/lib/db";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { email?: string; serviceConsent?: boolean } | null;
  const email = body?.email?.trim().toLowerCase();

  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  if (body?.serviceConsent === false) {
    return NextResponse.json({ error: "Service consent is required before starting an assessment." }, { status: 400 });
  }

  const id = crypto.randomUUID();
  await createSession(id);
  await setSessionEmail(id, email);
  const response = NextResponse.json({ sessionId: id }, { status: 201 });
  response.cookies.set("roots_session_id", id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  return response;
}