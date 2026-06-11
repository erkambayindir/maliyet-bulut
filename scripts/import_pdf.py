"""
ÇŞB Birim Fiyatları PDF -> PostgreSQL import scripti
Kullanım: python scripts/import_pdf.py
"""
import pdfplumber
import psycopg2
import re
import uuid
import os
import sys

PDF_PATH = r"C:\Users\ff\Downloads\Cevre Sehircilik Bakanlıgı Birim Fiyatları.pdf"
DATABASE_URL = "postgresql://postgres:!Postgrenopass1@localhost:5432/maliyet_bulut"

YEAR = "2026-Mayıs"
INSTITUTION = "ÇŞB"

# Fasikül başlıklarını tespit etmek için anahtar kelimeler
FASCICLE_KEYWORDS = {
    "Rayiç": "Rayiçler",
    "Malzeme Rayi": "Rayiçler",
    "İşçilik Rayi": "İşçilik Rayiçleri",
    "Makine Rayi": "Makine Rayiçleri",
    "Nakliye": "Nakliye",
    "İnşaat": "İnşaat",
    "Yapı İşleri": "İnşaat",
    "Elektrik": "Elektrik",
    "Tesisat": "Tesisat",
    "Peyzaj": "Peyzaj",
    "Çevre Düzen": "Peyzaj",
}

def detect_fascicle(text):
    for key, val in FASCICLE_KEYWORDS.items():
        if key.lower() in text.lower():
            return val
    return "İnşaat"

def clean_price(price_str):
    """'2.850,00' -> 2850.00"""
    if not price_str:
        return None
    cleaned = price_str.strip().replace(".", "").replace(",", ".")
    try:
        return float(cleaned)
    except:
        return None

def clean_text(text):
    """Encoding bozukluklarını düzelt"""
    if not text:
        return ""
    # Satır sonu temizle
    text = text.replace("\n", " ").strip()
    return text

def is_valid_poz_no(poz_no):
    """Geçerli poz numarası formatı: 10.130.1201 veya 15.150.1001 vb."""
    if not poz_no:
        return False
    poz_no = poz_no.strip()
    # Sayı ve nokta içermeli, en az 5 karakter
    return bool(re.match(r'^\d+[\.\d]+$', poz_no)) and len(poz_no) >= 5

def extract_pozlar(pdf_path):
    pozlar = []
    current_fascicle = "İnşaat"
    seen_poz_nos = set()

    print(f"PDF okunuyor: {pdf_path}")

    with pdfplumber.open(pdf_path) as pdf:
        total = len(pdf.pages)
        print(f"Toplam sayfa: {total}")

        for page_num, page in enumerate(pdf.pages):
            if page_num % 50 == 0:
                print(f"  Sayfa {page_num+1}/{total} işleniyor...")

            # Fasikül tespiti
            page_text = page.extract_text() or ""
            for key, val in FASCICLE_KEYWORDS.items():
                if key in page_text:
                    current_fascicle = val
                    break

            # Tablo çıkar
            tables = page.extract_tables()
            for table in tables:
                if not table or len(table) < 2:
                    continue

                # Header satırını tespit et
                header = [str(c or "").lower() for c in table[0]]
                has_poz = any("poz" in h for h in header)
                has_fiyat = any("fiyat" in h or "tl" in h for h in header)

                if not (has_poz or has_fiyat):
                    # Bazı sayfalarda header olmadan devam eder
                    pass

                for row in table[1:]:
                    if not row or len(row) < 3:
                        continue

                    # Poz no genellikle ilk veya ikinci kolonda
                    poz_no = None
                    description = None
                    unit = None
                    price = None

                    # Kolonları temizle
                    cols = [str(c or "").strip() for c in row]

                    # Poz no ara
                    for i, col in enumerate(cols):
                        col_clean = col.replace("\n", " ").strip()
                        # Sıra no temizle (örn: "10.130.1201\no" -> "10.130.1201")
                        col_clean = re.sub(r'\s*[a-zA-Z]\s*$', '', col_clean).strip()
                        if is_valid_poz_no(col_clean):
                            poz_no = col_clean
                            # Tanım bir sonraki kolonda
                            if i + 1 < len(cols):
                                description = clean_text(cols[i + 1])
                            # Birim ve fiyat daha sonra
                            remaining = cols[i + 2:]
                            # Birim: m3, m2, ton, adet vb.
                            for j, r in enumerate(remaining):
                                r_clean = r.strip().lower()
                                if r_clean in ["m³", "m3", "m²", "m2", "ton", "adet", "kg", "lt", "m", "yzm²", "bina", "bm", "bm²", "bina", "rm"]:
                                    unit = r.strip()
                                    # Fiyat sonraki kolonda
                                    if j + 1 < len(remaining):
                                        price = clean_price(remaining[j + 1])
                                    elif j + 2 < len(remaining):
                                        price = clean_price(remaining[j + 2])
                                    break
                                # Türkçe birim eşleştirmesi
                                if any(u in r_clean for u in ["m3", "m2", "m²", "m³", "ton", "adet", "kg"]):
                                    unit = r.strip()
                                    if j + 1 < len(remaining):
                                        price = clean_price(remaining[j + 1])
                                    break
                            break

                    if not poz_no or not description or not price:
                        continue
                    if poz_no in seen_poz_nos:
                        continue
                    if price <= 0:
                        continue

                    seen_poz_nos.add(poz_no)
                    pozlar.append({
                        "poz_no": poz_no,
                        "description": description[:500],
                        "unit": unit or "Adet",
                        "unit_price": price,
                        "fascicle": current_fascicle,
                    })

    return pozlar

def import_to_db(pozlar, db_url):
    # psycopg2 için URL parse
    # postgresql://user:pass@host:port/db
    match = re.match(r'postgresql://([^:]+):([^@]+)@([^:]+):(\d+)/(.+)', db_url)
    if not match:
        print("DATABASE_URL parse hatası!")
        return

    user, password, host, port, dbname = match.groups()

    conn = psycopg2.connect(
        host=host, port=int(port), dbname=dbname,
        user=user, password=password
    )
    cur = conn.cursor()

    # Önce mevcut ÇŞB pozlarını temizle
    cur.execute(
        'DELETE FROM "PozLibrary" WHERE "institutionName" = %s AND year = %s',
        (INSTITUTION, YEAR)
    )
    deleted = cur.rowcount
    print(f"{deleted} eski poz silindi.")

    inserted = 0
    for poz in pozlar:
        try:
            cur.execute("""
                INSERT INTO "PozLibrary" (id, "pozNo", description, unit, "unitPrice", year, "institutionName", "fascicleName")
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT ("pozNo", year, "institutionName") DO UPDATE
                SET description = EXCLUDED.description,
                    unit = EXCLUDED.unit,
                    "unitPrice" = EXCLUDED."unitPrice",
                    "fascicleName" = EXCLUDED."fascicleName"
            """, (
                str(uuid.uuid4()),
                poz["poz_no"],
                poz["description"],
                poz["unit"],
                poz["unit_price"],
                YEAR,
                INSTITUTION,
                poz["fascicle"],
            ))
            inserted += 1
        except Exception as e:
            print(f"  Hata ({poz['poz_no']}): {e}")

    conn.commit()
    cur.close()
    conn.close()
    print(f"\n✅ {inserted} poz veritabanına aktarıldı!")

if __name__ == "__main__":
    print("=" * 50)
    print("ÇŞB Birim Fiyatları PDF Import")
    print("=" * 50)

    pozlar = extract_pozlar(PDF_PATH)
    print(f"\nToplam {len(pozlar)} poz bulundu.")

    if pozlar:
        print("\nÖrnek pozlar:")
        for p in pozlar[:5]:
            print(f"  {p['poz_no']} | {p['description'][:50]} | {p['unit']} | {p['unit_price']}")

        print("\nVeritabanına aktarılıyor...")
        import_to_db(pozlar, DATABASE_URL)
    else:
        print("Hiç poz bulunamadı!")
