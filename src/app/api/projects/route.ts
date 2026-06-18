import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";

const createSchema = z.object({
  name: z.string().min(1),
  kdvRate: z.number().optional(),
  generalMarkup: z.number().optional(),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const projects = await prisma.project.findMany({
    where: user.role === "ADMIN" ? {} : { ownerId: user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      calculationDate: true,
      status: true,
      createdAt: true,
    },
  });
  return NextResponse.json(projects);
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const body = await request.json();
  const data = createSchema.parse(body);

  const project = await prisma.project.create({
    data: {
      name: data.name,
      kdvRate: data.kdvRate ?? 20,
      generalMarkup: data.generalMarkup ?? 25,
      ownerId: user.id,
      workGroups: {
        create: [
          { name: "İnşaat İmalatları", code: "I", order: 1 },
          { name: "Makine Tesisatı", code: "M", order: 2 },
          { name: "Elektrik Tesisatı", code: "E", order: 3 },
        ],
      },
    },
  });

  return NextResponse.json(project, { status: 201 });
}
