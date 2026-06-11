import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serialize } from "@/lib/serialize";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const institution = searchParams.get("institution");
  const year = searchParams.get("year");
  const fascicle = searchParams.get("fascicle");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const pageSize = Math.min(100, parseInt(searchParams.get("pageSize") ?? "50"));

  const where = {
    AND: [
      q ? {
        OR: [
          { pozNo: { contains: q, mode: "insensitive" as const } },
          { description: { contains: q, mode: "insensitive" as const } },
        ],
      } : {},
      institution ? { institutionName: institution } : {},
      year ? { year } : {},
      fascicle ? { fascicleName: fascicle } : {},
    ],
  };

  const [items, total] = await Promise.all([
    prisma.pozLibrary.findMany({
      where,
      orderBy: { pozNo: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.pozLibrary.count({ where }),
  ]);

  return NextResponse.json({
    items: items.map(serialize),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}

