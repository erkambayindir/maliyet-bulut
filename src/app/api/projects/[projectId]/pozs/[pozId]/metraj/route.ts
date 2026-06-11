import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PrismaClient } from "@/generated/prisma";
import { calcMetrajQty } from "@/lib/utils";
import { z } from "zod";
import Decimal from "decimal.js";

type TxClient = Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;

const rowSchema = z.object({
  description: z.string(),
  adet: z.number(),
  en: z.number(),
  boy: z.number(),
  yukseklik: z.number(),
  order: z.number().optional(),
});

const saveSchema = z.object({
  rows: z.array(rowSchema),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ pozId: string }> }
) {
  const { pozId } = await params;
  const rows = await prisma.metrajRow.findMany({
    where: { projectPozId: pozId },
    orderBy: { order: "asc" },
  });
  return NextResponse.json(rows.map(serialize));
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ pozId: string }> }
) {
  const { pozId } = await params;
  const body = await request.json();
  const { rows } = saveSchema.parse(body);

  // Delete existing rows and recreate (transactional)
  await prisma.$transaction(async (tx: TxClient) => {
    await tx.metrajRow.deleteMany({ where: { projectPozId: pozId } });

    let totalQty = new Decimal(0);

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const qty = calcMetrajQty(row.adet, row.en, row.boy, row.yukseklik);
      totalQty = totalQty.plus(qty);

      await tx.metrajRow.create({
        data: {
          projectPozId: pozId,
          description: row.description,
          adet: row.adet,
          en: row.en,
          boy: row.boy,
          yukseklik: row.yukseklik,
          computedQty: qty.toDecimalPlaces(4).toNumber(),
          order: row.order ?? i,
        },
      });
    }

    // Update parent poz quantity
    await tx.projectPoz.update({
      where: { id: pozId },
      data: { quantity: totalQty.toDecimalPlaces(4).toNumber() },
    });
  });

  const updatedRows = await prisma.metrajRow.findMany({
    where: { projectPozId: pozId },
    orderBy: { order: "asc" },
  });

  const updatedPoz = await prisma.projectPoz.findUnique({ where: { id: pozId } });

  return NextResponse.json({
    rows: updatedRows.map(serialize),
    quantity: serialize(updatedPoz?.quantity),
  });
}

function serialize(obj: unknown): unknown {
  if (obj instanceof Decimal) return obj.toNumber();
  if (obj instanceof Date) return obj.toISOString();
  if (Array.isArray(obj)) return obj.map(serialize);
  if (obj && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>).map(([k, v]) => [k, serialize(v)])
    );
  }
  return obj;
}
