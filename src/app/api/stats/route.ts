import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function toNum(v: unknown): number {
  if (typeof v === "number") return v;
  if (v && typeof (v as { toNumber?: () => number }).toNumber === "function")
    return (v as { toNumber: () => number }).toNumber();
  return Number(v) || 0;
}

export async function GET() {
  // Tüm proje pozlarını, ait olduğu proje bilgisiyle çek
  const pozs = await prisma.projectPoz.findMany({
    include: {
      workGroup: {
        select: {
          project: { select: { id: true, name: true, calculationDate: true } },
        },
      },
    },
  });

  // --- Poz bazlı agregasyonlar ---
  const byPozCount = new Map<string, number>();      // kullanım sıklığı
  const byPozAmount = new Map<string, number>();     // toplam parasal tutar
  const byPozQty = new Map<string, number>();        // toplam miktar

  // --- Proje bazlı agregasyon ---
  const byProject = new Map<string, { id: string; name: string; date: string; total: number }>();

  for (const p of pozs) {
    const qty = toNum(p.quantity);
    const price = toNum(p.unitPrice);
    const amount = qty * price;

    byPozCount.set(p.pozNo, (byPozCount.get(p.pozNo) ?? 0) + 1);
    byPozAmount.set(p.pozNo, (byPozAmount.get(p.pozNo) ?? 0) + amount);
    byPozQty.set(p.pozNo, (byPozQty.get(p.pozNo) ?? 0) + qty);

    const proj = p.workGroup?.project;
    if (proj) {
      const prev = byProject.get(proj.id) ?? {
        id: proj.id,
        name: proj.name,
        date: proj.calculationDate.toISOString(),
        total: 0,
      };
      prev.total += amount;
      byProject.set(proj.id, prev);
    }
  }

  const top = (m: Map<string, number>, n = 10) =>
    [...m.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([pozNo, value]) => ({ pozNo, value }));

  // Bu yıl hazırlanan projeler
  const currentYear = new Date().getFullYear();
  const allProjects = await prisma.project.findMany({
    select: { id: true, name: true, calculationDate: true },
    orderBy: { calculationDate: "desc" },
  });
  const thisYearProjects = allProjects
    .filter((p) => new Date(p.calculationDate).getFullYear() === currentYear)
    .map((p) => ({
      id: p.id,
      name: p.name,
      date: p.calculationDate.toISOString(),
    }));

  return NextResponse.json({
    enSikKullanilan: top(byPozCount),
    parasalEnYuksek: top(byPozAmount),
    enCokMiktar: top(byPozQty),
    ymEnYuksekProjeler: [...byProject.values()]
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)
      .map((p) => ({ name: p.name, total: p.total })),
    buYilProjeler: thisYearProjects,
  });
}
