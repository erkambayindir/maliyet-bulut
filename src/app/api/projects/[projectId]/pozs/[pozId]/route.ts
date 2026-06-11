import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serialize } from "@/lib/serialize";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ pozId: string }> }
) {
  const { pozId } = await params;
  const body = await request.json();

  const poz = await prisma.projectPoz.update({
    where: { id: pozId },
    data: {
      quantity: body.quantity !== undefined ? body.quantity : undefined,
      unitPrice: body.unitPrice !== undefined ? body.unitPrice : undefined,
      customPrice: body.customPrice !== undefined ? body.customPrice : undefined,
      markupPercent: body.markupPercent !== undefined ? body.markupPercent : undefined,
    },
  });

  return NextResponse.json(serialize(poz));
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ pozId: string }> }
) {
  const { pozId } = await params;
  await prisma.projectPoz.delete({ where: { id: pozId } });
  return NextResponse.json({ ok: true });
}
