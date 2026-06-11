import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function toNum(v: unknown): number {
  if (typeof v === "number") return v;
  if (v && typeof (v as { toNumber?: () => number }).toNumber === "function")
    return (v as { toNumber: () => number }).toNumber();
  return Number(v) || 0;
}

interface Poz {
  pozNo: string; description: string; unit: string;
  quantity: unknown; unitPrice: unknown;
}
interface Group {
  name: string; code: string | null;
  projectPozs: Poz[]; children: Group[];
}

function calcTotal(g: Group): number {
  return g.projectPozs.reduce((s, p) => s + toNum(p.quantity) * toNum(p.unitPrice), 0)
    + g.children.reduce((s, c) => s + calcTotal(c), 0);
}

function fmt(n: number, decimals = 2) {
  return new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n);
}

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// DXA sütun genişlikleri — A4 portrait, 851 DXA marjin her iki yanda
// İçerik genişliği: 11906 - 851 - 851 = 10204 DXA
const W = {
  sira:       500,   // Sıra No
  poz:       1150,   // Poz No
  tanim:     4554,   // İmalatın Cinsi (en geniş)
  birim:      700,   // Birim
  miktar:     900,   // Miktarı
  birimFiyat:1100,   // Birim Fiyatı
  tutar:     1300,   // Tutarı
  // Toplam: 500+1150+4554+700+900+1100+1300 = 10204 ✓
};
const TOTAL_W = Object.values(W).reduce((a, b) => a + b, 0);

function rpr(opts: { bold?: boolean; sz?: number; color?: string; font?: string }) {
  const { bold = false, sz = 18, color = "000000", font = "Arial" } = opts;
  return `<w:rPr>
    <w:rFonts w:ascii="${font}" w:hAnsi="${font}" w:cs="${font}"/>
    ${bold ? "<w:b/>" : ""}
    <w:sz w:val="${sz}"/><w:szCs w:val="${sz}"/>
    <w:color w:val="${color}"/>
  </w:rPr>`;
}

function para(text: string, opts: {
  bold?: boolean; sz?: number; color?: string;
  align?: string; before?: number; after?: number;
} = {}) {
  const { bold = false, sz = 18, color = "000000", align = "left", before = 0, after = 0 } = opts;
  return `<w:p>
    <w:pPr>
      <w:spacing w:before="${before}" w:after="${after}"/>
      <w:jc w:val="${align}"/>
      ${rpr({ bold, sz, color })}
    </w:pPr>
    <w:r>${rpr({ bold, sz, color })}<w:t xml:space="preserve">${esc(text)}</w:t></w:r>
  </w:p>`;
}

const BORDER = `
  <w:tcBorders>
    <w:top    w:val="single" w:sz="4" w:color="000000"/>
    <w:left   w:val="single" w:sz="4" w:color="000000"/>
    <w:bottom w:val="single" w:sz="4" w:color="000000"/>
    <w:right  w:val="single" w:sz="4" w:color="000000"/>
  </w:tcBorders>`;

const NO_BORDER = `
  <w:tcBorders>
    <w:top    w:val="none" w:sz="0" w:color="auto"/>
    <w:left   w:val="none" w:sz="0" w:color="auto"/>
    <w:bottom w:val="none" w:sz="0" w:color="auto"/>
    <w:right  w:val="none" w:sz="0" w:color="auto"/>
  </w:tcBorders>`;

function tc(w: number, content: string, opts: {
  align?: string; bold?: boolean; sz?: number; color?: string;
  shading?: string; vAlign?: string; noBorder?: boolean; span?: number;
} = {}) {
  const {
    align = "left", bold = false, sz = 18, color = "000000",
    shading, vAlign = "center", noBorder = false, span,
  } = opts;

  const shadingXml = shading
    ? `<w:shd w:val="clear" w:color="auto" w:fill="${shading}"/>`
    : "";
  const gridSpan = span ? `<w:gridSpan w:val="${span}"/>` : "";

  return `<w:tc>
    <w:tcPr>
      <w:tcW w:w="${w}" w:type="dxa"/>
      ${gridSpan}
      ${noBorder ? NO_BORDER : BORDER}
      ${shadingXml}
      <w:tcMar>
        <w:left  w:w="80" w:type="dxa"/>
        <w:right w:w="80" w:type="dxa"/>
      </w:tcMar>
      <w:vAlign w:val="${vAlign}"/>
    </w:tcPr>
    <w:p>
      <w:pPr>
        <w:spacing w:before="0" w:after="0"/>
        <w:jc w:val="${align}"/>
        ${rpr({ bold, sz, color })}
      </w:pPr>
      <w:r>${rpr({ bold, sz, color })}<w:t xml:space="preserve">${esc(content)}</w:t></w:r>
    </w:p>
  </w:tc>`;
}

function buildRows(groups: Group[], sira: { v: number }): string {
  let out = "";
  for (const g of groups) {
    const total = calcTotal(g);

    // Grup başlık satırı — açık gri arka plan
    out += `<w:tr>
      <w:trPr><w:trHeight w:val="380" w:hRule="atLeast"/></w:trPr>
      ${tc(W.sira, "", { shading: "E8E8E8", bold: true })}
      ${tc(W.poz, g.code ?? "", { shading: "E8E8E8", bold: true })}
      ${tc(W.tanim + W.birim + W.miktar + W.birimFiyat, g.name.toUpperCase(), {
        shading: "E8E8E8", bold: true, span: 4
      })}
      ${tc(W.tutar, fmt(total), { shading: "E8E8E8", bold: true, align: "right" })}
    </w:tr>`;

    // Poz satırları
    for (const poz of g.projectPozs) {
      const qty   = toNum(poz.quantity);
      const price = toNum(poz.unitPrice);
      const rowTotal = qty * price;

      out += `<w:tr>
        <w:trPr><w:trHeight w:val="340" w:hRule="atLeast"/></w:trPr>
        ${tc(W.sira, String(sira.v++), { align: "center" })}
        ${tc(W.poz, poz.pozNo)}
        ${tc(W.tanim, poz.description)}
        ${tc(W.birim, poz.unit, { align: "center" })}
        ${tc(W.miktar, fmt(qty, 3), { align: "right" })}
        ${tc(W.birimFiyat, fmt(price), { align: "right" })}
        ${tc(W.tutar, fmt(rowTotal), { align: "right" })}
      </w:tr>`;
    }

    // Alt gruplar
    if (g.children.length > 0) out += buildRows(g.children, sira);
  }
  return out;
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

  const grandTotal = (project.workGroups as Group[]).reduce((s, g) => s + calcTotal(g), 0);
  const dateStr = new Date(project.calculationDate).toLocaleDateString("tr-TR");
  const sira = { v: 1 };
  const dataRows = buildRows(project.workGroups as Group[], sira);

  const TEAL = "1A5C6E";

  const document = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document
  xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas"
  xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<w:body>

  <!-- BAŞLIK -->
  <w:p>
    <w:pPr>
      <w:jc w:val="center"/>
      <w:spacing w:before="0" w:after="160"/>
      ${rpr({ bold: true, sz: 26, color: TEAL })}
    </w:pPr>
    <w:r>${rpr({ bold: true, sz: 26, color: TEAL })}<w:t>YAKLAŞIK MALİYET CETVELİ</w:t></w:r>
  </w:p>

  <!-- BİLGİ SATIRI: Hazırlanma Tarihi / İşin Adı -->
  <w:tbl>
    <w:tblPr>
      <w:tblW w:w="${TOTAL_W}" w:type="dxa"/>
      <w:tblLayout w:type="fixed"/>
      <w:tblBorders>
        <w:top    w:val="none"/><w:left   w:val="none"/>
        <w:bottom w:val="none"/><w:right  w:val="none"/>
        <w:insideH w:val="none"/><w:insideV w:val="none"/>
      </w:tblBorders>
      <w:tblCellMar>
        <w:top w:w="0" w:type="dxa"/><w:left w:w="0" w:type="dxa"/>
        <w:bottom w:w="0" w:type="dxa"/><w:right w:w="0" w:type="dxa"/>
      </w:tblCellMar>
    </w:tblPr>
    <w:tblGrid>
      <w:gridCol w:w="2200"/>
      <w:gridCol w:w="${TOTAL_W - 2200}"/>
    </w:tblGrid>
    <w:tr>
      <w:trPr><w:trHeight w:val="300" w:hRule="exact"/></w:trPr>
      <w:tc>
        <w:tcPr><w:tcW w:w="2200" w:type="dxa"/>${NO_BORDER}<w:vAlign w:val="center"/></w:tcPr>
        <w:p>
          <w:pPr><w:spacing w:before="0" w:after="0"/><w:jc w:val="right"/>${rpr({ bold: true, sz: 18 })}</w:pPr>
          <w:r>${rpr({ bold: true, sz: 18 })}<w:t xml:space="preserve">Hazırlanma Tarihi:  </w:t></w:r>
        </w:p>
      </w:tc>
      <w:tc>
        <w:tcPr><w:tcW w:w="${TOTAL_W - 2200}" w:type="dxa"/>${NO_BORDER}<w:vAlign w:val="center"/></w:tcPr>
        <w:p>
          <w:pPr><w:spacing w:before="0" w:after="0"/>${rpr({ sz: 18 })}</w:pPr>
          <w:r>${rpr({ sz: 18 })}<w:t>${esc(dateStr)}</w:t></w:r>
        </w:p>
      </w:tc>
    </w:tr>
    <w:tr>
      <w:trPr><w:trHeight w:val="300" w:hRule="exact"/></w:trPr>
      <w:tc>
        <w:tcPr><w:tcW w:w="2200" w:type="dxa"/>${NO_BORDER}<w:vAlign w:val="center"/></w:tcPr>
        <w:p>
          <w:pPr><w:spacing w:before="0" w:after="0"/><w:jc w:val="right"/>${rpr({ bold: true, sz: 18 })}</w:pPr>
          <w:r>${rpr({ bold: true, sz: 18 })}<w:t xml:space="preserve">İşin Adı:  </w:t></w:r>
        </w:p>
      </w:tc>
      <w:tc>
        <w:tcPr><w:tcW w:w="${TOTAL_W - 2200}" w:type="dxa"/>${NO_BORDER}<w:vAlign w:val="center"/></w:tcPr>
        <w:p>
          <w:pPr><w:spacing w:before="0" w:after="0"/>${rpr({ sz: 18 })}</w:pPr>
          <w:r>${rpr({ sz: 18 })}<w:t>${esc(project.name)}</w:t></w:r>
        </w:p>
      </w:tc>
    </w:tr>
  </w:tbl>

  <w:p><w:pPr><w:spacing w:before="60" w:after="60"/></w:pPr></w:p>

  <!-- ANA CETVEL TABLOSU -->
  <w:tbl>
    <w:tblPr>
      <w:tblW w:w="${TOTAL_W}" w:type="dxa"/>
      <w:tblLayout w:type="fixed"/>
      <w:tblCellMar>
        <w:top w:w="0" w:type="dxa"/><w:left w:w="0" w:type="dxa"/>
        <w:bottom w:w="0" w:type="dxa"/><w:right w:w="0" w:type="dxa"/>
      </w:tblCellMar>
    </w:tblPr>
    <w:tblGrid>
      <w:gridCol w:w="${W.sira}"/>
      <w:gridCol w:w="${W.poz}"/>
      <w:gridCol w:w="${W.tanim}"/>
      <w:gridCol w:w="${W.birim}"/>
      <w:gridCol w:w="${W.miktar}"/>
      <w:gridCol w:w="${W.birimFiyat}"/>
      <w:gridCol w:w="${W.tutar}"/>
    </w:tblGrid>

    <!-- TABLO BAŞLIĞI -->
    <w:tr>
      <w:trPr>
        <w:trHeight w:val="600" w:hRule="atLeast"/>
        <w:tblHeader/>
      </w:trPr>
      ${tc(W.sira,      "Sıra No",      { bold: true, align: "center", vAlign: "center" })}
      ${tc(W.poz,       "Poz No",        { bold: true, align: "center", vAlign: "center" })}
      ${tc(W.tanim,     "İmalatın Cinsi",{ bold: true, align: "center", vAlign: "center" })}
      ${tc(W.birim,     "Birim",         { bold: true, align: "center", vAlign: "center" })}
      ${tc(W.miktar,    "Miktarı",       { bold: true, align: "center", vAlign: "center" })}
      ${tc(W.birimFiyat,"Birim Fiyatı",  { bold: true, align: "center", vAlign: "center" })}
      ${tc(W.tutar,     "Tutarı",        { bold: true, align: "center", vAlign: "center" })}
    </w:tr>

    ${dataRows}

    <!-- TOPLAM SATIRI -->
    <w:tr>
      <w:trPr><w:trHeight w:val="400" w:hRule="atLeast"/></w:trPr>
      ${tc(W.sira + W.poz + W.tanim + W.birim + W.miktar + W.birimFiyat,
           "Toplam:", { bold: true, align: "right", span: 6 })}
      ${tc(W.tutar, fmt(grandTotal), { bold: true, align: "right" })}
    </w:tr>
  </w:tbl>

  <!-- SAYFA AYARLARI: A4 Dikey -->
  <w:sectPr>
    <w:headerReference w:type="default" r:id="rId1"/>
    <w:pgSz w:w="11906" w:h="16838"/>
    <w:pgMar w:top="1134" w:right="851" w:bottom="851" w:left="851" w:header="709" w:footer="709" w:gutter="0"/>
  </w:sectPr>
</w:body>
</w:document>`;

  const header = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:hdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
       xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:p>
    <w:pPr>
      <w:jc w:val="right"/>
      <w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:sz w:val="16"/></w:rPr>
    </w:pPr>
    <w:r>
      <w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:sz w:val="16"/></w:rPr>
      <w:t xml:space="preserve">Sayfa: </w:t>
    </w:r>
    <w:r>
      <w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:sz w:val="16"/></w:rPr>
      <w:fldChar w:fldCharType="begin"/>
    </w:r>
    <w:r>
      <w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:sz w:val="16"/></w:rPr>
      <w:instrText xml:space="preserve"> PAGE </w:instrText>
    </w:r>
    <w:r>
      <w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:sz w:val="16"/></w:rPr>
      <w:fldChar w:fldCharType="end"/>
    </w:r>
    <w:r>
      <w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:sz w:val="16"/></w:rPr>
      <w:t xml:space="preserve">/</w:t>
    </w:r>
    <w:r>
      <w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:sz w:val="16"/></w:rPr>
      <w:fldChar w:fldCharType="begin"/>
    </w:r>
    <w:r>
      <w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:sz w:val="16"/></w:rPr>
      <w:instrText xml:space="preserve"> NUMPAGES </w:instrText>
    </w:r>
    <w:r>
      <w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:sz w:val="16"/></w:rPr>
      <w:fldChar w:fldCharType="end"/>
    </w:r>
  </w:p>
</w:hdr>`;

  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();

  zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/>
</Types>`);

  zip.file("_rels/.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`);

  zip.file("word/document.xml", document);
  zip.file("word/header1.xml", header);
  zip.file("word/_rels/document.xml.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header1.xml"/>
</Relationships>`);

  const buffer = await zip.generateAsync({ type: "uint8array", compression: "DEFLATE" });
  const safeName = project.name.replace(/[^\w\sğüşıöçĞÜŞİÖÇ]/g, "").trim();
  const filename = `YM_Cetveli_${safeName}_${dateStr.replace(/\./g, "-")}.docx`;

  return new NextResponse(buffer as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
    },
  });
}
