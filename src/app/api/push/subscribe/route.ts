import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });
  const body = (await req.json()) as {
    endpoint: string;
    keys: { p256dh: string; auth: string };
    userAgent?: string;
  };
  if (!body?.endpoint || !body.keys?.p256dh || !body.keys?.auth) {
    return new NextResponse("Bad payload", { status: 400 });
  }
  await prisma.pushSubscription.upsert({
    where: { endpoint: body.endpoint },
    update: {
      p256dh: body.keys.p256dh,
      authKey: body.keys.auth,
      userId: session.user.id,
      userAgent: body.userAgent ?? null,
    },
    create: {
      userId: session.user.id,
      endpoint: body.endpoint,
      p256dh: body.keys.p256dh,
      authKey: body.keys.auth,
      userAgent: body.userAgent ?? null,
    },
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });
  const body = (await req.json()) as { endpoint?: string };
  if (body?.endpoint) {
    await prisma.pushSubscription.deleteMany({
      where: { userId: session.user.id, endpoint: body.endpoint },
    });
  }
  return NextResponse.json({ ok: true });
}
