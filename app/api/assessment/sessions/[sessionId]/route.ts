import { NextResponse } from "next/server";
import { getSession, revokeSession } from "@/lib/db";
import { cookies } from "next/headers";

export async function GET(_request: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  const sessionCookie = (await cookies()).get("roots_session_id")?.value;
  if (sessionCookie !== sessionId) return NextResponse.json({ error: "Session unavailable." }, { status: 403 });
  const session = await getSession(sessionId);
  if (!session) return NextResponse.json({ error: "Session not found." }, { status: 404 });

  return NextResponse.json({
    sessionId: session.id,
    completedModules: session.completedModules,
    answers: session.answers,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    canonicalVersions: session.canonicalVersions,
  });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  const sessionCookie = (await cookies()).get("roots_session_id")?.value;
  if (sessionCookie !== sessionId) {
    return NextResponse.json({ error: "Session unavailable." }, { status: 403 });
  }

  const session = await getSession(sessionId);
  if (!session) return NextResponse.json({ error: "Session not found." }, { status: 404 });

  await revokeSession(sessionId);
  const response = NextResponse.json({ signedOut: true });
  response.cookies.set("roots_session_id", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return response;
}