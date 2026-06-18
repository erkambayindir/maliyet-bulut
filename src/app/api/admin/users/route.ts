import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

function toNum(v: unknown): number {
  if (typeof v === "number") return v;
  if (v && typeof (v as { toNumber?: () => number }).toNumber === "function")
    return (v as { toNumber: () => number }).toNumber();
  return Number(v) || 0;
}

export async function GET() {
  const me = await getCurrentUser();
  if (!me || me.role !== "ADMIN") {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      projects: {
        select: {
          id: true,
          workGroups: {
            select: {
              projectPozs: { select: { quantity: true, unitPrice: true } },
            },
          },
        },
      },
    },
  });

  const result = users.map((u) => {
    let totalValue = 0;
    let pozCount = 0;
    for (const proj of u.projects) {
      for (const wg of proj.workGroups) {
        for (const p of wg.projectPozs) {
          totalValue += toNum(p.quantity) * toNum(p.unitPrice);
          pozCount += 1;
        }
      }
    }
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt.toISOString(),
      projectCount: u.projects.length,
      pozCount,
      totalValue,
    };
  });

  return NextResponse.json(result);
}
