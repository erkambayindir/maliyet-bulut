import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serialize } from "@/lib/serialize";
import { logActivity } from "@/lib/activity";

function toNum(v: unknown): number {
  if (typeof v === "number") return v;
  if (v && typeof (v as { toNumber?: () => number }).toNumber === "function")
    return (v as { toNumber: () => number }).toNumber();
  return Number(v) || 0;
}

// Poz'un proje + grup bilgisini getirir (log için)
async function getPozContext(pozId: string) {
  return prisma.projectPoz.findUnique({
    where: { id: pozId },
    select: {
      pozNo: true,
      workGroup: { select: { name: true, project: { select: { id: true, name: true } } } },
    },
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ pozId: string }> }
) {
  const { pozId } = await params;
  const body = await request.json();

  const ctx = await getPozContext(pozId);

  const poz = await prisma.projectPoz.update({
    where: { id: pozId },
    data: {
      quantity: body.quantity !== undefined ? body.quantity : undefined,
      unitPrice: body.unitPrice !== undefined ? body.unitPrice : undefined,
      customPrice: body.customPrice !== undefined ? body.customPrice : undefined,
      markupPercent: body.markupPercent !== undefined ? body.markupPercent : undefined,
    },
  });

  // Hangi alan değişti, ona göre log
  let action: string | null = null;
  if (body.quantity !== undefined) {
    action = `Miktar değişti: ${toNum(body.quantity)}`;
  } else if (body.unitPrice !== undefined) {
    action = `Birim fiyat değişti: ${toNum(body.unitPrice)}`;
  }
  if (action && ctx) {
    await logActivity({
      projectId: ctx.workGroup?.project.id,
      projectName: ctx.workGroup?.project.name ?? "—",
      workGroupName: ctx.workGroup?.name,
      pozNo: ctx.pozNo,
      action,
    });
  }

  return NextResponse.json(serialize(poz));
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ pozId: string }> }
) {
  const { pozId } = await params;

  const ctx = await getPozContext(pozId);
  await prisma.projectPoz.delete({ where: { id: pozId } });

  if (ctx) {
    await logActivity({
      projectId: ctx.workGroup?.project.id,
      projectName: ctx.workGroup?.project.name ?? "—",
      workGroupName: ctx.workGroup?.name,
      pozNo: ctx.pozNo,
      action: "İş kalemi silindi",
    });
  }

  return NextResponse.json({ ok: true });
}
