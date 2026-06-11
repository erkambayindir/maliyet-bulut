import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL ?? "" });
const prisma = new PrismaClient({ adapter });

const POZ_DATA = [
  // ÇŞB İnşaat - Kazı ve Dolgu
  { pozNo: "16.001/1", description: "Her derinlikte yumuşak zemin kazısı (bel küreği ile)", unit: "m³", unitPrice: 285.50, fascicleName: "İnşaat" },
  { pozNo: "16.001/2", description: "Her derinlikte orta sert zemin kazısı (kazma ile)", unit: "m³", unitPrice: 420.75, fascicleName: "İnşaat" },
  { pozNo: "16.001/3", description: "Her derinlikte sert zemin kazısı (pnömatik kırıcı ile)", unit: "m³", unitPrice: 680.00, fascicleName: "İnşaat" },
  { pozNo: "16.002/1", description: "Kazı fazlasının 500 m'ye kadar nakli (kamyon ile)", unit: "m³", unitPrice: 195.00, fascicleName: "İnşaat" },
  { pozNo: "16.003/1", description: "Dolgu malzemesinin serilmesi ve sıkıştırılması", unit: "m³", unitPrice: 145.80, fascicleName: "İnşaat" },

  // ÇŞB İnşaat - Beton İmalatları
  { pozNo: "15.150.1001", description: "C20/25 hazır beton dökülmesi (vibratör dahil)", unit: "m³", unitPrice: 3850.00, fascicleName: "İnşaat" },
  { pozNo: "15.150.1002", description: "C25/30 hazır beton dökülmesi (vibratör dahil)", unit: "m³", unitPrice: 4120.00, fascicleName: "İnşaat" },
  { pozNo: "15.150.1003", description: "C30/37 hazır beton dökülmesi (vibratör dahil)", unit: "m³", unitPrice: 4480.00, fascicleName: "İnşaat" },
  { pozNo: "15.150.1004", description: "C35/45 hazır beton dökülmesi (vibratör dahil)", unit: "m³", unitPrice: 4950.00, fascicleName: "İnşaat" },
  { pozNo: "15.001", description: "Grobeton (C8/10) dökülmesi", unit: "m³", unitPrice: 2650.00, fascicleName: "İnşaat" },

  // ÇŞB İnşaat - Demir İmalatları
  { pozNo: "15.160.1001", description: "Betonarme demiri (nervürlü) temin ve yerleştirilmesi - Φ8-Φ12", unit: "ton", unitPrice: 42500.00, fascicleName: "İnşaat" },
  { pozNo: "15.160.1002", description: "Betonarme demiri (nervürlü) temin ve yerleştirilmesi - Φ14-Φ20", unit: "ton", unitPrice: 41800.00, fascicleName: "İnşaat" },
  { pozNo: "15.160.1003", description: "Betonarme demiri (nervürlü) temin ve yerleştirilmesi - Φ22-Φ32", unit: "ton", unitPrice: 41200.00, fascicleName: "İnşaat" },

  // ÇŞB İnşaat - Kalıp İmalatları
  { pozNo: "15.010", description: "Düz ahşap kalıp yapılması (temel, perde, kolon, kiriş, döşeme)", unit: "m²", unitPrice: 485.00, fascicleName: "İnşaat" },
  { pozNo: "15.011", description: "Metal (çelik) kalıp yapılması", unit: "m²", unitPrice: 320.00, fascicleName: "İnşaat" },

  // ÇŞB İnşaat - Duvar İmalatları
  { pozNo: "21.010/1", description: "Gazbeton (ytong) duvar örülmesi 20 cm", unit: "m²", unitPrice: 680.00, fascicleName: "İnşaat" },
  { pozNo: "21.010/2", description: "Gazbeton (ytong) duvar örülmesi 10 cm", unit: "m²", unitPrice: 420.00, fascicleName: "İnşaat" },
  { pozNo: "21.002/1", description: "Tuğla duvar örülmesi (19.5x9x4) - tek sıra", unit: "m²", unitPrice: 520.00, fascicleName: "İnşaat" },
  { pozNo: "21.002/2", description: "Tuğla duvar örülmesi (19.5x9x4) - çift sıra", unit: "m²", unitPrice: 890.00, fascicleName: "İnşaat" },

  // ÇŞB İnşaat - Sıva ve Alçı
  { pozNo: "22.010", description: "İç cephe çimento sıvası (1.5 cm)", unit: "m²", unitPrice: 185.00, fascicleName: "İnşaat" },
  { pozNo: "22.020", description: "Dış cephe çimento sıvası (2 cm)", unit: "m²", unitPrice: 245.00, fascicleName: "İnşaat" },
  { pozNo: "22.030", description: "Alçı sıva (1 cm)", unit: "m²", unitPrice: 145.00, fascicleName: "İnşaat" },
  { pozNo: "22.040", description: "Alçıpan asma tavan yapılması", unit: "m²", unitPrice: 380.00, fascicleName: "İnşaat" },

  // ÇŞB İnşaat - Boyalar
  { pozNo: "27.010", description: "İç cephe su bazlı boya (2 kat astar + 2 kat boya)", unit: "m²", unitPrice: 95.00, fascicleName: "İnşaat" },
  { pozNo: "27.020", description: "Dış cephe silikonlu boya uygulaması", unit: "m²", unitPrice: 185.00, fascicleName: "İnşaat" },
  { pozNo: "27.030", description: "Ahşap yüzeylere yağlı boya", unit: "m²", unitPrice: 125.00, fascicleName: "İnşaat" },

  // ÇŞB İnşaat - Kaplama ve Seramik
  { pozNo: "25.010", description: "Seramik zemin kaplaması (30x30)", unit: "m²", unitPrice: 380.00, fascicleName: "İnşaat" },
  { pozNo: "25.011", description: "Seramik zemin kaplaması (60x60)", unit: "m²", unitPrice: 520.00, fascicleName: "İnşaat" },
  { pozNo: "25.020", description: "Duvar seramiği yapıştırılması", unit: "m²", unitPrice: 320.00, fascicleName: "İnşaat" },
  { pozNo: "25.030", description: "Mermer zemin döşenmesi (2 cm)", unit: "m²", unitPrice: 980.00, fascicleName: "İnşaat" },

  // ÇŞB İnşaat - Çatı
  { pozNo: "28.010", description: "Trapez çelik sac çatı örtüsü (0.6 mm)", unit: "m²", unitPrice: 285.00, fascicleName: "İnşaat" },
  { pozNo: "28.020", description: "Kiremit çatı örtüsü (marsilya tipi)", unit: "m²", unitPrice: 320.00, fascicleName: "İnşaat" },
  { pozNo: "28.030", description: "Bitümlü membran su yalıtımı (çift kat)", unit: "m²", unitPrice: 245.00, fascicleName: "İnşaat" },

  // ÇŞB İnşaat - Yalıtım
  { pozNo: "26.010", description: "Dış cephe ısı yalıtımı (EPS 5 cm)", unit: "m²", unitPrice: 285.00, fascicleName: "İnşaat" },
  { pozNo: "26.011", description: "Dış cephe ısı yalıtımı (EPS 8 cm)", unit: "m²", unitPrice: 365.00, fascicleName: "İnşaat" },
  { pozNo: "26.020", description: "Zemin altı su yalıtımı (bitümlü)", unit: "m²", unitPrice: 185.00, fascicleName: "İnşaat" },

  // ÇŞB Elektrik
  { pozNo: "E.01.001", description: "NYY 4x10 mm² kablo çekilmesi", unit: "m", unitPrice: 185.00, fascicleName: "Elektrik" },
  { pozNo: "E.01.002", description: "NYY 4x25 mm² kablo çekilmesi", unit: "m", unitPrice: 320.00, fascicleName: "Elektrik" },
  { pozNo: "E.02.001", description: "Sigorta grubu (10A-63A arası) montajı", unit: "adet", unitPrice: 850.00, fascicleName: "Elektrik" },
  { pozNo: "E.03.001", description: "Priz (topraklı) montajı", unit: "adet", unitPrice: 185.00, fascicleName: "Elektrik" },
  { pozNo: "E.03.002", description: "Anahtar (tek) montajı", unit: "adet", unitPrice: 145.00, fascicleName: "Elektrik" },
  { pozNo: "E.04.001", description: "Aydınlatma armatürü (LED panel 60x60) montajı", unit: "adet", unitPrice: 680.00, fascicleName: "Elektrik" },

  // ÇŞB Mekanik Tesisat
  { pozNo: "T.01.001", description: "PPR boru 20 mm temin ve montajı", unit: "m", unitPrice: 95.00, fascicleName: "Tesisat" },
  { pozNo: "T.01.002", description: "PPR boru 32 mm temin ve montajı", unit: "m", unitPrice: 145.00, fascicleName: "Tesisat" },
  { pozNo: "T.02.001", description: "Alçıpan içi pis su borusu (PVC Ø100) montajı", unit: "m", unitPrice: 185.00, fascicleName: "Tesisat" },
  { pozNo: "T.03.001", description: "Duş seti montajı (ankastre)", unit: "adet", unitPrice: 2850.00, fascicleName: "Tesisat" },
  { pozNo: "T.03.002", description: "Lavabo montajı", unit: "adet", unitPrice: 1250.00, fascicleName: "Tesisat" },
  { pozNo: "T.04.001", description: "Kombi (24.000 Btu) temin ve montajı", unit: "adet", unitPrice: 18500.00, fascicleName: "Tesisat" },
  { pozNo: "T.05.001", description: "Radyatör (6 dilim) temin ve montajı", unit: "adet", unitPrice: 1850.00, fascicleName: "Tesisat" },

  // ÇŞB İnşaat - Çelik Konstrüksiyon
  { pozNo: "14.001", description: "Çelik konstrüksiyon (HEA-HEB profil) imalat ve montajı", unit: "ton", unitPrice: 85000.00, fascicleName: "İnşaat" },
  { pozNo: "14.002", description: "Çelik konstrüksiyon boyası (epoksi astar + son kat)", unit: "m²", unitPrice: 185.00, fascicleName: "İnşaat" },
];

async function main() {
  console.log("Seed başlıyor...");

  await prisma.pozLibrary.deleteMany();
  console.log("Mevcut kütüphane temizlendi.");

  const year = "2026-Mayıs";
  const institution = "ÇŞB";

  for (const poz of POZ_DATA) {
    await prisma.pozLibrary.create({
      data: {
        pozNo: poz.pozNo,
        description: poz.description,
        unit: poz.unit,
        unitPrice: poz.unitPrice,
        year,
        institutionName: institution,
        fascicleName: poz.fascicleName,
      },
    });
  }

  console.log(`${POZ_DATA.length} poz kütüphaneye eklendi.`);

  // Demo proje oluştur
  const demoProject = await prisma.project.create({
    data: {
      name: "Demo Konut Projesi",
      calculationDate: new Date(),
      status: "ACTIVE",
    },
  });

  const insaatGrubu = await prisma.workGroup.create({
    data: {
      name: "İnşaat İmalatları",
      code: "I",
      order: 1,
      projectId: demoProject.id,
    },
  });

  const kabaInsaat = await prisma.workGroup.create({
    data: {
      name: "Kaba İnşaat",
      code: "I.1",
      order: 1,
      parentId: insaatGrubu.id,
      projectId: demoProject.id,
    },
  });

  await prisma.workGroup.create({
    data: {
      name: "İnce İşler",
      code: "I.2",
      order: 2,
      parentId: insaatGrubu.id,
      projectId: demoProject.id,
    },
  });

  await prisma.workGroup.create({
    data: {
      name: "Makine Tesisatı",
      code: "M",
      order: 2,
      projectId: demoProject.id,
    },
  });

  await prisma.workGroup.create({
    data: {
      name: "Elektrik Tesisatı",
      code: "E",
      order: 3,
      projectId: demoProject.id,
    },
  });

  // Demo pozlar ekle
  const betoniPoz = await prisma.pozLibrary.findFirst({ where: { pozNo: "15.150.1001" } });
  const kalibiPoz = await prisma.pozLibrary.findFirst({ where: { pozNo: "15.010" } });

  if (betoniPoz) {
    await prisma.projectPoz.create({
      data: {
        pozNo: betoniPoz.pozNo,
        description: betoniPoz.description,
        unit: betoniPoz.unit,
        quantity: 120,
        unitPrice: betoniPoz.unitPrice,
        order: 1,
        workGroupId: kabaInsaat.id,
      },
    });
  }

  if (kalibiPoz) {
    await prisma.projectPoz.create({
      data: {
        pozNo: kalibiPoz.pozNo,
        description: kalibiPoz.description,
        unit: kalibiPoz.unit,
        quantity: 350,
        unitPrice: kalibiPoz.unitPrice,
        order: 2,
        workGroupId: kabaInsaat.id,
      },
    });
  }

  console.log("Demo proje oluşturuldu:", demoProject.id);
  console.log("Seed tamamlandı!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
