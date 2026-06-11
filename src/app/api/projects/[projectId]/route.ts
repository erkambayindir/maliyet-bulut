import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serialize } from "@/lib/serialize";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      workGroups: {
        orderBy: { order: "asc" },
        include: {
          children: {
            orderBy: { order: "asc" },
            include: {
              children: {
                orderBy: { order: "asc" },
                include: {
                  projectPozs: { orderBy: { order: "asc" } },
                },
              },
              projectPozs: { orderBy: { order: "asc" } },
            },
          },
          projectPozs: { orderBy: { order: "asc" } },
        },
      },
    },
  });

  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(serialize(project));
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const body = await request.json();

  const project = await prisma.project.update({
    where: { id: projectId },
    data: {
      name: body.name,
      calculationDate: body.calculationDate ? new Date(body.calculationDate) : undefined,
      kdvRate: body.kdvRate,
      generalMarkup: body.generalMarkup,
      status: body.status,
    },
  });

  return NextResponse.json(serialize(project));
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  await prisma.project.delete({ where: { id: projectId } });
  return NextResponse.json({ ok: true });
}

