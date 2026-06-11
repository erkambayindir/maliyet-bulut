import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import ExcelJS from "exceljs";
import Decimal from "decimal.js";

function toNum(v: unknown): number {
  if (typeof v === "number") return v;
  if (v && typeof (v as { toNumber?: () => number }).toNumber === "function")
    return (v as { toNumber: () => number }).toNumber();
  return Number(v) || 0;
}

function calcGroupTotal(group: GroupWithChildren): number {
  const own = group.projectPozs.reduce(
    (s, p) => s + toNum(p.quantity) * toNum(p.unitPrice),
    0
  );
  return own + group.children.reduce((s, c) => s + calcGroupTotal(c), 0);
}

interface ProjectPoz {
  pozNo: string;
  description: string;
  unit: string;
  quantity: unknown;
  unitPrice: unknown;
}

interface GroupWithChildren {
  id: string;
  name: string;
  code: string | null;
  projectPozs: ProjectPoz[];
  children: GroupWithChildren[];
}

// Türkçe para formatı
function formatTL(val: number): string {
  return new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val);
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      workGroups: {
        where: { parentId: null },
        orderBy: { order: "asc" },
        include: {
          projectPozs: { orderBy: { order: "asc" } },
          children: {
            orderBy: { order: "asc" },
            include: {
              projectPozs: { orderBy: { order: "asc" } },
              children: {
                orderBy: { order: "asc" },
                include: { projectPozs: { orderBy: { order: "asc" } } },
              },
            },
          },
        },
      },
    },
  });

  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "MaliyetBulut";
  workbook.created = new Date();

  const ws = workbook.addWorksheet("Yaklaşık Maliyet Cetveli", {
    pageSetup: {
      paperSize: 9,          // A4
      orientation: "portrait",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: { left: 0.3, right: 0.3, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 },
    },
  });

  // --- Kolon genişlikleri (A4 portrait ~19cm içerik genişliğine sığdırıldı) ---
  ws.columns = [
    { key: "sira",       width: 5   },  // Sıra No
    { key: "pozNo",      width: 13  },  // Poz No
    { key: "tanim",      width: 42  },  // Tanımı (en geniş)
    { key: "birim",      width: 7   },  // Birimi
    { key: "miktar",     width: 10  },  // Miktarı
    { key: "birimFiyat", width: 13  },  // Birim Fiyatı
    { key: "tutar",      width: 14  },  // Tutarı
  ];

  // --- Renk paleti ---
  const TEAL_DARK  = "FF0F4C54";
  const TEAL_MID   = "FF1A7A8A";
  const TEAL_LIGHT = "FFE0F4F6";
  const GRAY_LIGHT = "FFF5F5F5";
  const WHITE      = "FFFFFFFF";
  const GOLD       = "FFFFC000";

  const border: Partial<ExcelJS.Borders> = {
    top:    { style: "thin", color: { argb: "FFD0D0D0" } },
    left:   { style: "thin", color: { argb: "FFD0D0D0" } },
    bottom: { style: "thin", color: { argb: "FFD0D0D0" } },
    right:  { style: "thin", color: { argb: "FFD0D0D0" } },
  };

  const dateStr = new Date(project.calculationDate).toLocaleDateString("tr-TR");

  // --- Başlık ---
  ws.mergeCells("A1:G1");
  ws.getRow(1).height = 30;
  const titleCell = ws.getCell("A1");
  titleCell.value = "YAKLAŞIK MALİYET CETVELİ";
  titleCell.font = { name: "Arial", size: 14, bold: true, color: { argb: TEAL_DARK } };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };

  // --- Bilgi satırları ---
  ws.mergeCells("A2:G2");
  ws.getRow(2).height = 16;
  const projCell = ws.getCell("A2");
  projCell.value = `Hazırlanma Tarihi:  ${dateStr}          İşin Adı:  ${project.name}`;
  projCell.font = { name: "Arial", size: 9, color: { argb: "FF333333" } };
  projCell.alignment = { horizontal: "center", vertical: "middle" };

  // --- Tablo başlığı ---
  const headerRow = ws.addRow(["S.No", "Poz No", "Tanımı", "Birimi", "Miktarı", "Birim Fiyatı (₺)", "Tutarı (₺)"]);
  headerRow.height = 30;
  headerRow.eachCell((cell) => {
    cell.font = { name: "Arial", size: 9, bold: true, color: { argb: WHITE } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: TEAL_DARK } };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.border = border;
  });

  // --- Veri satırları ---
  let siraNo = 1;
  const grandTotal = project.workGroups.reduce(
    (s, g) => s + calcGroupTotal(g as GroupWithChildren),
    0
  );

  function addGroup(group: GroupWithChildren, depth: number) {
    const groupTotal = calcGroupTotal(group);
    const indent = "  ".repeat(depth);

    // Grup başlık satırı
    const gRow = ws.addRow([
      "",
      group.code ?? "",
      `${indent}${group.name.toUpperCase()}`,
      "",
      "",
      "",
      formatTL(groupTotal),
    ]);
    gRow.height = 16;
    gRow.eachCell((cell, col) => {
      cell.font = {
        name: "Arial",
        size: 9,
        bold: true,
        color: { argb: depth === 0 ? WHITE : TEAL_DARK },
      };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: depth === 0 ? TEAL_MID : TEAL_LIGHT },
      };
      cell.border = border;
      if (col === 7) {
        cell.alignment = { horizontal: "right", vertical: "middle" };
        cell.numFmt = "#,##0.00";
        cell.value = groupTotal;
      } else {
        cell.alignment = { vertical: "middle" };
      }
    });

    // Poz satırları
    group.projectPozs.forEach((poz) => {
      const qty = toNum(poz.quantity);
      const price = toNum(poz.unitPrice);
      const total = qty * price;

      // Tanım sütunu genişliği 42 karakter → satır başına ~52 karakter (8.5pt Arial)
      // Yüksekliği metne göre dinamik hesapla
      const CHARS_PER_LINE = 52;
      const LINE_HEIGHT = 12.5; // pt
      const MIN_HEIGHT = 15;
      const descLines = Math.ceil((poz.description?.length ?? 0) / CHARS_PER_LINE);
      const rowHeight = Math.max(MIN_HEIGHT, descLines * LINE_HEIGHT + 4);

      const pRow = ws.addRow([
        siraNo++,
        poz.pozNo,
        poz.description,
        poz.unit,
        qty,
        price,
        total,
      ]);
      pRow.height = rowHeight;
      pRow.eachCell((cell, col) => {
        cell.font = { name: "Arial", size: 8.5 };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: siraNo % 2 === 0 ? WHITE : GRAY_LIGHT },
        };
        cell.border = border;

        if (col === 1) { cell.alignment = { horizontal: "center", vertical: "middle" }; }
        else if (col === 3) { cell.alignment = { vertical: "middle", wrapText: true }; }
        else if (col === 4) { cell.alignment = { horizontal: "center", vertical: "middle" }; }
        else if (col === 5) { cell.numFmt = "#,##0.000"; cell.alignment = { horizontal: "right", vertical: "middle" }; }
        else if (col === 6) { cell.numFmt = "#,##0.00"; cell.alignment = { horizontal: "right", vertical: "middle" }; }
        else if (col === 7) { cell.numFmt = "#,##0.00"; cell.alignment = { horizontal: "right", vertical: "middle" }; }
        else { cell.alignment = { vertical: "middle" }; }
      });
    });

    // Alt gruplar
    group.children.forEach((child) => addGroup(child as GroupWithChildren, depth + 1));
  }

  project.workGroups.forEach((g) => addGroup(g as GroupWithChildren, 0));

  // --- Genel Toplam satırı ---
  const totalRow = ws.addRow(["", "", "GENEL TOPLAM", "", "", "", grandTotal]);
  totalRow.height = 20;
  totalRow.eachCell((cell, col) => {
    cell.font = { name: "Arial", size: 9, bold: true, color: { argb: WHITE } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: TEAL_DARK } };
    cell.border = border;
    if (col === 3) cell.alignment = { horizontal: "right", vertical: "middle" };
    if (col === 7) {
      cell.numFmt = "#,##0.00";
      cell.alignment = { horizontal: "right", vertical: "middle" };
    }
  });

  // --- Yazdırma alanı & sayfa ayarı ---
  ws.pageSetup.printArea = `A1:G${ws.rowCount}`;
  ws.pageSetup.fitToPage = true;
  ws.pageSetup.fitToWidth = 1;
  ws.pageSetup.fitToHeight = 0;

  // --- Header/Footer ---
  ws.headerFooter.oddHeader = `&C&"Arial,Bold"&10${project.name} — Yaklaşık Maliyet Cetveli`;
  ws.headerFooter.oddFooter = `&L&8MaliyetBulut&C&8Sayfa &P / &N&R&8${dateStr}`;

  // Excel buffer'ı oluştur
  const buffer = await workbook.xlsx.writeBuffer();

  const safeName = project.name.replace(/[^a-zA-Z0-9ğüşıöçĞÜŞİÖÇ\s]/g, "").trim();
  const filename = `YM_Cetveli_${safeName}_${dateStr.replace(/\./g, "-")}.xlsx`;

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
    },
  });
}
