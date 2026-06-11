import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { serialize } from "@/lib/serialize";

const addSchema = z.object({
  pozNo: z.string(),
  description: z.string(),
  unit: z.string(),
  unitPrice: z.number(),
  workGroupId: z.string(),
  order: z.number().optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  await params;
  const body = await request.json();
  const data = addSchema.parse(body);

  const poz = await prisma.projectPoz.create({
    data: {
      pozNo: data.pozNo,
      description: data.description,
      unit: data.unit,
      quantity: 0,
      unitPrice: data.unitPrice,
      order: data.order ?? 0,
      workGroupId: data.workGroupId,
    },
  });

  return NextResponse.json(serialize(poz), { status: 201 });
}
