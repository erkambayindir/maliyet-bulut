# MEMORY — Çalışma Günlüğü

> Her prompt sonrası yapılan işlerin kronolojik kaydı. En yeni en üstte.

---

## 2026-06-18 — İşlem geçmişi kullanıcı izolasyonu
- Sorun: Kullanıcı İşlemleri her kullanıcıya TÜM logları gösteriyordu; ayrıca `logActivity` sabit admin e-postası yazıyordu (gerçek kullanıcıyı değil).
- `ActivityLog`'a `userId` eklendi (migration `activity_user_id`, yerel + Neon).
- `logActivity` artık `getCurrentUser()` ile işlemi YAPAN kullanıcıyı (userId + email) yazar.
- `/api/activity` filtrelendi: admin tüm loglar, normal kullanıcı yalnızca `userId===kendi`.
- Eski sahipsiz loglar admin'e backfill edildi (Neon 4, yerel 2).

## 2026-06-18 — Veri izolasyonu sağlamlaştırma + sahipsiz projeler
- Sorun: Neon'daki "Hhgg" ve "Demo Konut Projesi" sahipsiz (ownerId=null) kalmıştı (auth öncesi/erken deployment). Sahipsiz projeleri yalnızca admin görüyordu.
- Her iki proje admin'e (erkam.bayindir@gmail.com) bağlandı (Neon + yerel UPDATE).
- Ana sayfa sorgusu sağlamlaştırıldı: kullanıcı yoksa `[]` döner — `{ ownerId: undefined }` footgun'ı (Prisma'nın undefined filtreyi yok sayıp TÜM satırları döndürmesi) engellendi.
- Doğrulama: normal kullanıcı (Bilal) ownerId filtresi nedeniyle admin projelerini görmez.

## 2026-06-18 — Kullanıcı sistemi & oturum (auth) eklendi
- **Karar:** e-posta + şifre (bcrypt + jose JWT, httpOnly çerez). Admin = ADMIN_EMAIL ile kayıt olan (erkam.bayindir@gmail.com).
- Şema: `User` modeli (email, passwordHash, name, role) + `Project.ownerId`. Migration `add_users_auth` yerel + Neon.
- `src/lib/auth.ts`: hash/verify, JWT sign/verify, çerez set/clear, getCurrentUser, registerUser (ADMIN_EMAIL→ADMIN), authenticateUser.
- API: `/api/auth/register|login|logout`.
- `src/proxy.ts` (Next 16 middleware→proxy konvansiyonu): giriş yoksa /giris'e yönlendirir; girişliyse /giris,/kayit'tan ana sayfaya.
- Sayfalar: `/giris`, `/kayit` (teal gradient kart).
- TopNav kullanıcı dropdown menüsü: Hesabım / Kullanıcı Yönetimi (admin) / İş Dosyası Yönetimi / İmza Listesi / Çıkış Yap. `TopNavServer` ile gerçek oturum kullanıcısı geçiriliyor.
- **Veri izolasyonu:** ana sayfa + /api/projects + proje layout — admin tümünü, kullanıcı yalnızca ownerId===kendisi. Proje oluşturmada ownerId set ediliyor.
- Admin: `/kullanici-yonetimi` (+ `/api/admin/users`) — kullanıcı listesi + proje/poz/YM değeri istatistikleri, özet kartlar.
- `/hesabim` (oturum bilgisi), `/is-dosyasi-yonetimi` + `/imza-listesi` placeholder.
- .env'ye SESSION_SECRET + ADMIN_EMAIL eklendi (Vercel'e de eklenmeli).
- DESIGN.md'ye auth ekranı + dropdown menü + admin stat kartı eklendi.
- .env (SESSION_SECRET, ADMIN_EMAIL) ve env değişkenleri Vercel'de tanımlanmalı (deploy notu).

## 2026-06-18 — Birim Fiyatlar (kütüphane) sayfası eklendi
- `/birim-fiyatlar` OSKA kütüphane ekranı: sol kurum ağacı (ÇŞB veri var, diğer kurumlar görsel/pasif), sağda "Pozlar" tablosu (Poz No / Tanımı / Birimi / Birim Fiyatı + yıl seçici / Kitap Adı / Fasikül Adı), kırmızı arama ikonu, sayfalama (toplam öğe sayısı tr-TR).
- Mevcut `/api/poz-library` endpoint'i yeniden kullanıldı (q, institution, year, fascicle, page).
- Placeholder'dan gerçek sayfaya dönüştürüldü.

## 2026-06-18 — Kullanıcı İşlemleri (audit log) eklendi
- Prisma'ya `ActivityLog` modeli eklendi (denormalize: projectName, workGroupName, pozNo, action, userName, createdAt). Migration `add_activity_log` yerel + Neon'a uygulandı (Neon compute psql ile uyandırıldıktan sonra).
- `src/lib/activity.ts` — `logActivity()` yardımcısı (hata olsa ana işlemi bozmaz, kullanıcı şimdilik sabit erkam.bayindir@gmail.com).
- Poz API route'larına log eklendi: ekleme → "İş kalemi eklendi", PATCH → "Miktar değişti: X" / "Birim fiyat değişti: X", DELETE → "İş kalemi silindi".
- `/api/activity` listeleme (arama destekli, son 500, yeni→eski).
- `/kullanici-islemleri` OSKA tarzı tablo: İş Dosyası / İş Grubu / İş Kalemi / İşlem / Kullanıcı Adı / Zaman + arama kutusu.

## 2026-06-18 — Akıllı Panel (dashboard) eklendi
- `recharts` kuruldu.
- `/api/stats` endpoint'i: tüm ProjectPoz'ları çekip JS'de agregasyon yapar — poz kullanım sıklığı, parasal tutar, miktar; proje bazlı YM toplamı; bu yıl hazırlanan projeler.
- `AkilliPanelClient.tsx`: OSKA tarzı 5 widget (başlık + kırmızı çizgi + ikonlar):
  1. YM'de En Sık Kullanılan 10 Poz (bar)
  2. Parasal Tutarı En Yüksek 10 Poz (bar)
  3. En Çok Miktarda Kullanılan 10 Poz (bar)
  4. YM Değeri En Yüksek 10 Proje (tablo)
  5. Bu Yıl İçerisinde Hazırlanmış YM Dosyaları (tablo)
- `/akilli-panel` placeholder'dan gerçek panele dönüştürüldü.
- DESIGN.md'ye chart rengi (`chartBar #3b9fd1`) ve widget kart bileşeni eklendi.

## 2026-06-18 — PostgreSQL Windows servisi
- pg_ctl register ile PostgreSQL "Automatic" Windows servisi yapıldı (açılışta otomatik başlar). Kod değişikliği yok.

## 2026-06-18 — OSKA tarzı üst menü (TopNav) + ana sayfa yeniden tasarım
- `src/components/layout/TopNav.tsx` eklendi: beyaz çubuk, MALİYETBULUT logo, yatay menü (Projeler, Benim Kitaplarım, Akıllı Panel, Kullanıcı İşlemleri, Birim Fiyatlar, Yardım, Satın Al), sağda kullanıcı + kredi ikonu, altta teal çizgi. `usePathname` ile aktif öğe vurgusu.
- Henüz yapılmamış 6 menü için `YakindaPage` bileşeni + placeholder route'lar (benim-kitaplarim, akilli-panel, kullanici-islemleri, birim-fiyatlar, yardim, satin-al).
- Ana sayfa koyu gradient'ten **açık gri temaya** çevrildi, TopNav entegre edildi.
- `ProjectListClient` OSKA tarzına göre yeniden yazıldı: turuncu "Yeni Proje Oluştur" butonu, "Proje Ara" arama kutusu, tablo görünümü (Projenin Adı / Hesap Tarihi), satıra tıklayınca proje açılır, altta Arşiv / Çöp Kutusu butonları.
- DESIGN.md'ye turuncu aksiyon rengi (`actionOrange`) ve TopNav bileşeni eklendi.

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
