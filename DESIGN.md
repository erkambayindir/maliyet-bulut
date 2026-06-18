---
# MaliyetBulut Design Tokens (machine-readable)
# google-labs-code/design.md formatı — YAML front matter + markdown gerekçe

colors:
  # Marka — koyu teal (sidebar, başlıklar)
  brandDarkest:   "#0f2a2e"   # Sidebar arka planı, ana sayfa gradient başı
  brandDeep:      "#0f4c54"   # Excel başlık dolgusu, vurgu
  brandMid:       "#1a4a52"   # Ana sayfa gradient sonu
  brandTeal:      "#1a5c6e"   # Word başlık metni
  # Aksan — teal (butonlar, aktif durumlar)
  primary:        "#0d9488"   # teal-600, birincil buton, aktif satır
  primaryHover:   "#0f766e"   # teal-700, hover
  primaryLight:   "#e0f4f6"   # teal-50/light, grup satırı arka planı
  accentTextDark: "#115e59"   # teal-800, açık zeminde grup metni
  # Aksiyon renkleri
  excelGreen:     "#16a34a"   # green-600, Excel indirme butonu
  wordBlue:       "#2563eb"   # blue-600, Word indirme butonu
  danger:         "#dc2626"   # red-600, silme
  # Nötrler
  surface:        "#ffffff"   # Kart/tablo arka planı
  surfaceAlt:     "#f5f5f5"   # Zebra satır, başlık şeridi
  surfaceMuted:   "#f3f4f6"   # gray-100, tablo başlığı
  border:         "#e5e7eb"   # gray-200, kenarlık
  borderStrong:   "#d0d0d0"   # Excel/Word hücre kenarlığı
  textPrimary:    "#171717"   # Ana metin
  textSecondary:  "#6b7280"   # gray-500, ikincil metin
  textMuted:      "#9ca3af"   # gray-400, placeholder/ikon

typography:
  fontSans:
    fontFamily: "Inter, system-ui, sans-serif"
  monoNumbers:
    fontVariantNumeric: "tabular-nums"   # Finansal hizalama için
  title:
    fontSize: "1.25rem"   # text-xl, sayfa başlığı
    fontWeight: 600
  sectionLabel:
    fontSize: "0.75rem"   # text-xs, uppercase grup etiketi
    fontWeight: 600
    letterSpacing: "0.05em"
    textTransform: "uppercase"
  tableCell:
    fontSize: "0.875rem"  # text-sm
    fontWeight: 400
  exportFont:
    fontFamily: "Arial"   # Excel/Word çıktıları (evrensel uyum)

spacing:
  sidebarWidth: "15rem"    # w-60
  groupPanelWidth: "14rem" # w-56, YM Cetveli sol panel
  cellPadX: "0.75rem"      # px-3
  cellPadY: "0.5rem"       # py-2

rounded:
  sm: "0.375rem"   # rounded-md, buton/input
  md: "0.5rem"     # rounded-lg, kart
  lg: "0.75rem"    # rounded-xl, modal/tablo konteyner

elevation:
  card: "0 1px 2px 0 rgb(0 0 0 / 0.05)"        # shadow-sm
  modal: "0 25px 50px -12px rgb(0 0 0 / 0.25)" # shadow-2xl

components:
  primaryButton:
    background: "{colors.primary}"
    backgroundHover: "{colors.primaryHover}"
    text: "#ffffff"
    rounded: "{rounded.sm}"
  sidebar:
    background: "{colors.brandDarkest}"
    text: "#d1d5db"
    activeBackground: "{colors.primary}"
    activeText: "#ffffff"
  tableHeader:
    background: "{colors.surfaceMuted}"
    text: "{colors.textSecondary}"
  groupRow:
    background: "{colors.primaryLight}"
    text: "{colors.accentTextDark}"
  modal:
    background: "{colors.surface}"
    overlay: "rgb(0 0 0 / 0.5)"
    rounded: "{rounded.lg}"
    elevation: "{elevation.modal}"
---

# MaliyetBulut — Tasarım Sistemi

## Overview

MaliyetBulut, kamu ihale mühendislerinin günlerce kullandığı bir **üretkenlik aracı**dır; estetikten önce **netlik, yoğunluk ve güven** gelir. Görsel dil, Excel'e alışkın kullanıcıya tanıdık gelen yoğun veri tabloları ile modern bir web uygulamasının ferahlığını birleştirir. Marka rengi **koyu teal**; kurumsal, sakin ve "mühendislik" çağrışımı yapan bir tondur. OSKA Bulut referans alınmıştır ama daha temiz tipografi ve daha tutarlı boşluk kullanılır.

## Colors

- **Koyu teal ailesi** (`brandDarkest`→`brandTeal`) navigasyon, başlık ve rapor başlıklarında kimliği taşır. Sidebar her zaman en koyu ton (`#0f2a2e`).
- **Primary teal** (`#0d9488`) etkileşimli her şeyin rengidir: birincil butonlar, aktif menü öğesi, seçili iş grubu, hücre düzenleme kenarlığı.
- **Aksiyon renkleri** dosya türünü kodlar: Excel **yeşil**, Word **mavi**, silme **kırmızı**. Bu eşleştirme tutarlı kalmalı.
- **Nötrler** veri yoğun tabloların okunabilirliği içindir; zebra satırlar `surfaceAlt`, başlık şeridi `surfaceMuted`.

## Typography

- Arayüz fontu **Inter** — yüksek x-yüksekliği, sayısal okunabilirlik.
- Para ve miktar hücrelerinde **`tabular-nums`** zorunlu; rakamlar sütun halinde hizalanmalı.
- Para/sayı her zaman **tr-TR** locale: `192.013,80 ₺` (virgül ondalık, nokta binlik).
- **Rapor çıktıları (Excel/Word) Arial** kullanır — Office uygulamalarında evrensel uyum için, Inter değil.

## Layout

- **İki sütunlu çalışma alanı:** sol sabit sidebar (`15rem`) + içerik. YM Cetveli ayrıca kendi içinde sol grup paneli (`14rem`) + sağ tablo kullanır.
- Tablolar **yoğun**: satır yüksekliği minimumda, hücre dolgusu `px-3 py-2`. Amaç bir ekranda maksimum poz göstermek.
- Modal'lar ortalanmış, `max-h-[90vh]`, kendi içinde kaydırma.

## Elevation & Depth

- Düz, minimal gölge. Kartlar `shadow-sm`, sadece modal'lar belirgin `shadow-2xl` + arka plan blur ile öne çıkar.
- Derinlik renkle de ifade edilir: aktif/seçili öğeler dolu teal, hover'da hafif mavi/gri tint.

## Shapes

- Yuvarlatma ölçeği: input/buton `rounded-md`, kart `rounded-lg`, modal & tablo konteyner `rounded-xl`.
- Rapor tabloları (Excel/Word) keskin köşeli, ince gri kenarlıklı — basılı KİK belgesi estetiği.

## Components

- **Birincil buton:** dolu teal, beyaz metin, `rounded-md`, ikon + etiket.
- **Sidebar öğesi:** aktifken dolu teal; pasifken `#d1d5db` metin, hover'da `white/10` zemin.
- **Grup satırı (YM Cetveli):** açık teal zemin, koyu teal kalın metin, büyük harf — poz satırlarından görsel olarak ayrışır.
- **Tablo başlığı:** `surfaceMuted` zemin, ikincil metin, sticky.
- **Modal:** beyaz, `rounded-xl`, `black/50` overlay + blur, ESC ile kapanır.

## Do's and Don'ts

- ✅ Para/miktarda `tabular-nums` ve tr-TR formatı kullan.
- ✅ Aksiyon renk kodunu koru (Excel=yeşil, Word=mavi, sil=kırmızı).
- ✅ Etkileşimli her öğede `primary` teal'i tutarlı kullan.
- ✅ Tabloları yoğun tut; boşluğu içerik için harca.
- ❌ Rapor çıktılarında Inter kullanma — Arial.
- ❌ Sidebar'ı en koyu teal dışında bir tonla boyama.
- ❌ Ondalık ayracı olarak nokta gösterme (giriş kabul edilir ama gösterim virgül).
- ❌ Yeni vurgu renkleri ekleme; mevcut paletten seç.
