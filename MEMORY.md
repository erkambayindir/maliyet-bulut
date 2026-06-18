# MEMORY — Çalışma Günlüğü

> Her prompt sonrası yapılan işlerin kronolojik kaydı. En yeni en üstte.

---

## 2026-06-18 — Dokümantasyon dosyaları kuruldu
- `CLAUDE.md` proje bağlamıyla dolduruldu (teknoloji yığını, mimari, konvansiyonlar, deployment, veri durumu, yapılacaklar).
- `MEMORY.md` çalışma günlüğü oluşturuldu (bu dosya).
- `DESIGN.md` oluşturuldu — google-labs-code/design.md yaklaşımı (YAML token + markdown gerekçe). Renk paleti, tipografi, layout, bileşenler koddan çıkarıldı.
- Kullanıcı talebi: bundan sonra her prompt sonrası bu üç dosya ilgili şekilde güncellenecek.

## 2026-06-18 — Vercel deployment erişim sorunu
- Arkadaşı siteye giremiyordu (Vercel abonelik ekranı çıkıyordu).
- Sebep: Vercel **Deployment Protection / Vercel Authentication** açık.
- Çözüm: Settings → Deployment Protection → Vercel Authentication → Disabled.
- Kullanıcıya doğru kalıcı URL verildi (branch alias), eski immutable deployment URL'leri kullanmaması söylendi.

## 2026-06-18 — Vercel + Neon canlı deploy tamamlandı
- GitHub repo: erkambayindir/maliyet-bulut.
- Bir dizi build hatası çözüldü:
  - `prisma generate` build adımına eklendi.
  - Prisma client `node_modules`'a taşındı, `@/generated/prisma` → `@prisma/client`.
  - `prisma.config.ts` fallback URL.
  - Ana sayfa `force-dynamic` (build-time DB bağlantısı koparıyordu).
  - **Asıl runtime sorunu:** Neon adapter yanlış constructor (`neon()` instance yerine `{ connectionString }` gerekiyordu) + `ws` paketi eklendi.
- Neon'a migration deploy edildi, yerel veritabanı pg_dump ile Neon'a aktarıldı (10.957 poz + demo proje).
- Doğrulama: en son deployment 200 OK; kullanıcı eski URL'yi açtığı için hata görüyordu.

## 2026-06-18 — Excel/Word export iyileştirmeleri
- Word export referans dosyaya (Korucuk-YM) göre yeniden yazıldı: A4 dikey, teal başlık, sağ üst sayfa no, bilgi tablosu + cetvel + toplam.
- Sütun genişlikleri A4 portrait içerik genişliğine (10204 DXA) sığdırıldı.
- Excel: A4 dikey, fitToWidth, Arial, dinamik satır yüksekliği (uzun tanımlar tam okunuyor).

## 2026-06-18 — Haziran 2026 fiyatları + tam veri import
- yfk.csb.gov.tr'den 2026-Haziran PDF'leri (İnşaat/Mekanik/Elektrik) indirildi, import edildi.
- Masaüstündeki tam Mayıs PDF'i 2026-Haziran/İnşaat olarak yeniden import edildi (422 → 5.985 poz).
- Poz Ekle modalı fasikül adları DB ile eşitlendi (İnşaat, Mekanik Tesisat, Elektrik).

## 2026-06-11 — Excel export + ilk PDF import + YM Cetveli düzeltmeleri
- `scripts/import_pdf.py` ile masaüstü ÇŞB PDF'inden 1.598 poz aktarıldı (2026-Mayıs).
- Poz Ekle modalı OSKA tarzı yeniden tasarlandı (kurum ağacı + sayfalı tablo).
- YM Cetveli layout OSKA'ya benzetildi (sol grup paneli + sağ tablo).
- Decimal serileştirme hatası çözüldü (`serialize()` merkezi fonksiyon).
- Miktar düzenleme optimistic update ile anında yansıyor.
- Excel export eklendi (exceljs).

## (Faz 1 kurulum) — Proje iskeleti
- Next.js + TypeScript + Tailwind + Prisma kuruldu.
- PostgreSQL yerel kurulum (zip → C:\pgsql, data C:\pgdata).
- 7 modelli Prisma şeması, migration, seed.
- Sidebar, YM Cetveli, Poz modalı, proje listesi temel UI.
