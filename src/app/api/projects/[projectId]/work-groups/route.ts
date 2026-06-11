import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1),
  code: z.string().optional(),
  parentId: z.string().nullable().optional(),
  order: z.number().optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const body = await request.json();
  const data = createSchema.parse(body);

  const group = await prisma.workGroup.create({
    data: {
      name: data.name,
      code: data.code,
      parentId: data.parentId ?? null,
      order: data.order ?? 0,
      projectId,
    },
  });

  return NextResponse.json(group, { status: 201 });
}
