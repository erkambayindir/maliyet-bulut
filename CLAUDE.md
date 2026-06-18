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
- `prisma/schema.prisma` — 9 model: User, Project (ownerId→User), WorkGroup (self-referencing WBS ağacı), PozLibrary, ProjectPoz, MetrajRow, DemirajRow, AnalysisItem, ActivityLog.
- `src/lib/activity.ts` — `logActivity()`; poz ekle/değiştir/sil işlemleri buradan kaydedilir, Kullanıcı İşlemleri sayfasında listelenir.
- `src/lib/auth.ts` — Oturum/kimlik: bcrypt + jose JWT (httpOnly çerez `mb_session`), `getCurrentUser()`, register/authenticate. ADMIN_EMAIL ile kayıt = ADMIN rolü.
- `src/proxy.ts` — Next 16 proxy (eski middleware). Oturum yoksa korumalı sayfaları /giris'e yönlendirir.
- `src/components/layout/TopNavServer.tsx` — Oturum kullanıcısını çekip TopNav'a geçiren server wrapper. TopNav kullanan TÜM sayfalar bunu kullanmalı.
- `src/app/projeler/[projectId]/ym-cetveli/` — Ana ekran: sol İş Grupları paneli + sağ poz tablosu. Inline hücre düzenleme + optimistic update.
- `src/components/modals/PozEkleModal.tsx` — Kurum/fasikül ağacı + sayfalı poz arama.
- `src/components/layout/TopNav.tsx` — Ana sayfa üst menü çubuğu (Projeler, Benim Kitaplarım, Akıllı Panel, Kullanıcı İşlemleri, Birim Fiyatlar, Yardım, Satın Al). Çoğu menü `YakindaPage` placeholder'ına gider.
- `src/app/api/projects/[projectId]/export/route.ts` — Excel export (A4 dikey, dinamik satır yüksekliği).
- `src/app/api/projects/[projectId]/export-word/route.ts` — Word export (ham OOXML, A4 dikey).
- `scripts/*.py` — PDF'den poz import scriptleri (pdfplumber + psycopg2). `import_generic.py <pdf> <kurum> <fasikül> <yıl> [yerel|neon]` standart 4-kolon (POZ NO|TANIM|BİRİM|FİYAT) PDF'leri içe aktarır; `import_kgm.py` KGM'nin özel formatı için.

## Kritik Konvansiyonlar

1. **Decimal serileştirme zorunlu:** Prisma `Decimal` nesnesi client component'e ham geçerse runtime hatası verir. Server component/API'de `serialize()` kullan.
2. **Türkçe yerelleştirme:** Tüm para/sayı `tr-TR` (virgül ondalık, nokta binlik). Ondalık girişlerde hem `,` hem `.` kabul edilir.
3. **force-dynamic:** DB'ye build-time'da bağlanan sayfalar `export const dynamic = "force-dynamic"` olmalı (Vercel build'i koparmaması için).
3a. **Oturum & izolasyon:** Veri çeken her sayfa/route `getCurrentUser()` ile kullanıcıyı almalı; admin tümünü, normal kullanıcı yalnızca `ownerId===kendi`. TopNav yerine `TopNavServer` kullan. `SESSION_SECRET` + `ADMIN_EMAIL` env zorunlu.
4. **Prisma v7:** `url` schema'da YOK; `prisma.config.ts` + adapter ile bağlanır. Client `node_modules/@prisma/client`'a generate edilir (`@/generated/prisma` DEĞİL).

## Veri Durumu (Neon prod)

Poz kütüphanesi — toplam ~16.510 poz, 4 kurum:
- **ÇŞB** (10.957): 2026-Mayıs/İnşaat 1.598, 2026-Haziran/İnşaat 5.985, /Elektrik 1.828, /Mekanik Tesisat 1.546. Kaynak: `yfk.csb.gov.tr`.
- **İller Bankası** (2.962): 2026-Haziran/Altyapı. Kaynak: `ilbank.gov.tr`.
- **DSİ** (1.940): 2026-Ocak/İnşaat. Kaynak: `tarimorman` CDN.
- **KGM** (651): 2026-Ocak/Yapım. Kaynak: `kgm.gov.tr`.

Aylık güncellenir. DLH/Kültür/MSB/Orman/PTT/TEDAŞ/Vakıflar ayrı dijital kitap yayınlamaz (placeholder).

## Deployment

- **Platform:** Vercel + Neon (serverless PostgreSQL)
- **Repo:** github.com/erkambayindir/maliyet-bulut (master branch)
- **Build komutu:** `prisma generate && next build`
- **Env:** `DATABASE_URL` (Neon pooler), `SESSION_SECRET` (JWT imzası), `ADMIN_EMAIL` (admin e-postası) Vercel'de tanımlı olmalı
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
- Akıllı Panel (dashboard): `/api/stats` + recharts ile 5 widget
- Kullanıcı İşlemleri (audit log), Birim Fiyatlar (kütüphane) sayfaları
- **Kullanıcı sistemi & oturum:** kayıt/giriş/çıkış, veri izolasyonu, admin Kullanıcı Yönetimi (istatistikler), kullanıcı dropdown menüsü

## Henüz Yapılmadı

- İmalat Metrajı sayfası (boyutsal giriş → miktar)
- Demir Metrajı (çap bazlı tonaj)
- Analizler (alt bileşen kırılımı)
- İş Grupları yönetim ekranı (ekle/sil/düzenle UI)
- Projenin Bilgileri ekranı
- Üst menü içerikleri (Benim Kitaplarım, Yardım, Satın Al) + kullanıcı menüsü (İş Dosyası Yönetimi, İmza Listesi) — `YakindaPage` placeholder
- Ana sayfa Arşiv / Çöp Kutusu işlevleri (buton var, işlev yok)
- Şifre değiştirme / profil düzenleme (Hesabım şu an salt-okunur)
