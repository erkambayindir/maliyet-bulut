import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serialize } from "@/lib/serialize";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";

  const logs = await prisma.activityLog.findMany({
    where: q
      ? {
          OR: [
            { projectName: { contains: q, mode: "insensitive" } },
            { workGroupName: { contains: q, mode: "insensitive" } },
            { pozNo: { contains: q, mode: "insensitive" } },
            { action: { contains: q, mode: "insensitive" } },
            { userName: { contains: q, mode: "insensitive" } },
          ],
        }
      : {},
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  return NextResponse.json(serialize(logs));
}
