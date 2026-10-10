import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSession } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Return only the safe summary needed to offer a resume action. */
export async function GET() {
  const sessionId = (await cookies()).get("roots_session_id")?.value;
  if (!sessionId) {
    return NextResponse.json({ session: null }, { headers: { "Cache-Control": "no-store" } });
  }

  const session = await getSession(sessionId);
  if (!session) {
    return NextResponse.json({ session: null }, { headers: { "Cache-Control": "no-store" } });
  }

  return NextResponse.json(
    {
      session: {
        sessionId: session.id,
        completedModules: session.completedModules,
        updatedAt: session.updatedAt,
      },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
