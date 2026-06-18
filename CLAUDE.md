@AGENTS.md

# MaliyetBulut — Proje Bağlamı

> Bu dosya projenin yaşayan dokümantasyonudur. Her önemli değişiklikten sonra güncellenir.
> Tasarım kararları için `DESIGN.md`, yapılan işlerin kronolojik kaydı için `MEMORY.md` dosyalarına bakın.

## Proje Nedir

Türkiye inşaat sektörü için **yaklaşık maliyet ve metraj hesaplama** platformu. OSKA Bulut (oskabulut.com) referans alınarak geliştirilen bir klon. Çevre, Şehircilik ve İklim Değişikliği Bakanlığı (ÇŞB) resmi birim fiyat kitaplarını kullanarak ihale öncesi yaklaşık maliyet cetveli üretir.

## Teknoloji Yığını

| Katman | Teknoloji |
|--------|-----------|
| Framework | Next.js 16.2.7 (App Router, Turbopack) |
| Dil | TypeScript |
| Stil | Tailwind CSS v4 |
| ORM | Prisma v7.8 (driver adapters) |
| Veritabanı | PostgreSQL (yerel: pgsql, prod: Neon) |
| Hassas hesap | decimal.js |
| Tablo | TanStack Table |
| Form | React Hook Form + Zod |
| İkonlar | lucide-react |
| Rapor | exceljs (Excel), jszip + ham OOXML (Word) |

## Mimari & Önemli Dosyalar

- `src/lib/prisma.ts` — Ortam-duyarlı Prisma client. `neon.tech` URL'sinde WebSocket tabanlı `@prisma/adapter-neon`, yerelde `@prisma/adapter-pg` kullanır.
- `src/lib/serialize.ts` — Prisma `Decimal`/`Date` nesnelerini client'a güvenli aktarmak için plain JS'e çevirir. **Tüm server→client veri aktarımında kullanılmalı.**
- `src/lib/utils.ts` — `formatCurrency`, `formatNumber` (tr-TR locale), `calcMetrajQty`, `calcRebarKg`, demir ağırlık tablosu.
- `prisma/schema.prisma` — 8 model: Project, WorkGroup (self-referencing WBS ağacı), PozLibrary, ProjectPoz, MetrajRow, DemirajRow, AnalysisItem, ActivityLog (audit log, denormalize).
- `src/lib/activity.ts` — `logActivity()`; poz ekle/değiştir/sil işlemleri buradan kaydedilir, Kullanıcı İşlemleri sayfasında listelenir.
- `src/app/projeler/[projectId]/ym-cetveli/` — Ana ekran: sol İş Grupları paneli + sağ poz tablosu. Inline hücre düzenleme + optimistic update.
- `src/components/modals/PozEkleModal.tsx` — Kurum/fasikül ağacı + sayfalı poz arama.
- `src/components/layout/TopNav.tsx` — Ana sayfa üst menü çubuğu (Projeler, Benim Kitaplarım, Akıllı Panel, Kullanıcı İşlemleri, Birim Fiyatlar, Yardım, Satın Al). Çoğu menü `YakindaPage` placeholder'ına gider.
- `src/app/api/projects/[projectId]/export/route.ts` — Excel export (A4 dikey, dinamik satır yüksekliği).
- `src/app/api/projects/[projectId]/export-word/route.ts` — Word export (ham OOXML, A4 dikey).
- `scripts/*.py` — PDF'den poz import scriptleri (pdfplumber + psycopg2).

## Kritik Konvansiyonlar

1. **Decimal serileştirme zorunlu:** Prisma `Decimal` nesnesi client component'e ham geçerse runtime hatası verir. Server component/API'de `serialize()` kullan.
2. **Türkçe yerelleştirme:** Tüm para/sayı `tr-TR` (virgül ondalık, nokta binlik). Ondalık girişlerde hem `,` hem `.` kabul edilir.
3. **force-dynamic:** DB'ye build-time'da bağlanan sayfalar `export const dynamic = "force-dynamic"` olmalı (Vercel build'i koparmaması için).
4. **Prisma v7:** `url` schema'da YOK; `prisma.config.ts` + adapter ile bağlanır. Client `node_modules/@prisma/client`'a generate edilir (`@/generated/prisma` DEĞİL).

## Veri Durumu (Neon prod)

ÇŞB poz kütüphanesi — toplam ~10.957 poz:
- 2026-Mayıs / İnşaat: 1.598
- 2026-Haziran / İnşaat: 5.985
- 2026-Haziran / Elektrik: 1.828
- 2026-Haziran / Mekanik Tesisat: 1.546

Aylık güncellenir. Kaynak: ÇŞB Yüksek Fen Kurulu PDF'leri (`yfk.csb.gov.tr`).

## Deployment

- **Platform:** Vercel + Neon (serverless PostgreSQL)
- **Repo:** github.com/erkambayindir/maliyet-bulut (master branch)
- **Build komutu:** `prisma generate && next build`
- **Env:** `DATABASE_URL` (Neon pooler connection string) Vercel'de tanımlı
- **Güncel URL:** `maliyet-bulut-git-master-erkambayindir-2637s-projects.vercel.app` (branch alias, her push'ta güncellenir)
- **Migration:** `DATABASE_URL=<neon> npx prisma migrate deploy`

## Tamamlanan Özellikler (Faz 1)

- Proje listesi & oluşturma
- YM Cetveli (sol grup ağacı + sağ poz tablosu, inline düzenleme, bubble-up toplam)
- Poz Ekle modalı (kurum/fasikül/yıl filtreli, sayfalı arama)
- Excel & Word export (A4, KİK formatı)
- ÇŞB PDF'lerinden otomatik poz import
- Vercel + Neon canlı deploy
- Ana sayfa OSKA tarzı üst menü (TopNav) + tablo görünümü
- Akıllı Panel (dashboard): `/api/stats` + recharts ile 5 widget (en sık/en pahalı/en çok miktar poz, en yüksek YM proje, bu yıl dosyaları)

## Henüz Yapılmadı

- İmalat Metrajı sayfası (boyutsal giriş → miktar)
- Demir Metrajı (çap bazlı tonaj)
- Analizler (alt bileşen kırılımı)
- İş Grupları yönetim ekranı (ekle/sil/düzenle UI)
- Projenin Bilgileri ekranı
- Üst menü içerikleri (Benim Kitaplarım, Birim Fiyatlar, Yardım, Satın Al) — şu an `YakindaPage` placeholder (Akıllı Panel + Kullanıcı İşlemleri TAMAMLANDI)
- Ana sayfa Arşiv / Çöp Kutusu işlevleri (buton var, işlev yok)
- Kimlik doğrulama / çok kullanıcılı yapı
