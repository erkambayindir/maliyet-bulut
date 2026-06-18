import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serialize } from "@/lib/serialize";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";

  // Admin tüm logları, normal kullanıcı yalnızca kendi işlemlerini görür
  const ownerFilter = user.role === "ADMIN" ? {} : { userId: user.id };

  const searchFilter = q
    ? {
        OR: [
          { projectName: { contains: q, mode: "insensitive" as const } },
          { workGroupName: { contains: q, mode: "insensitive" as const } },
          { pozNo: { contains: q, mode: "insensitive" as const } },
          { action: { contains: q, mode: "insensitive" as const } },
          { userName: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : {};

  const logs = await prisma.activityLog.findMany({
    where: { AND: [ownerFilter, searchFilter] },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  return NextResponse.json(serialize(logs));
}
