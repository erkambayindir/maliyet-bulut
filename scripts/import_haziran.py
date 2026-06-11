"""
ÇŞB 2026-Haziran Birim Fiyatları import scripti (İnşaat + Mekanik + Elektrik)
"""
import pdfplumber
import psycopg2
import re
import uuid

DATABASE_URL = "postgresql://postgres:!Postgrenopass1@localhost:5432/maliyet_bulut"
YEAR = "2026-Haziran"
INSTITUTION = "ÇŞB"

PDFS = [
    ("C:/Users/ff/Downloads/csb_2026_haziran/insaat_birim_fiyat.pdf", "İnşaat"),
    ("C:/Users/ff/Downloads/csb_2026_haziran/mekanik_birim_fiyat.pdf", "Mekanik Tesisat"),
    ("C:/Users/ff/Downloads/csb_2026_haziran/elektrik_birim_fiyat.pdf", "Elektrik"),
]

def clean_price(s):
    if not s: return None
    s = str(s).strip().replace("\n", "").replace(" ", "")
    s = s.replace(".", "").replace(",", ".")
    try:
        v = float(s)
        return v if v > 0 else None
    except:
        return None

def clean_text(s):
    if not s: return ""
    return str(s).replace("\n", " ").strip()

def is_poz_no(s):
    if not s: return False
    s = str(s).strip()
    s = re.sub(r'\s*[a-zA-Z]\s*$', '', s).strip()
    return bool(re.match(r'^\d{2,}[\.\d]+$', s)) and len(s) >= 5

def extract(pdf_path, fascicle):
    pozlar = []
    seen = set()
    print(f"\n  {pdf_path.split('/')[-1]} okunuyor...")

    with pdfplumber.open(pdf_path) as pdf:
        total = len(pdf.pages)
        print(f"  Toplam {total} sayfa")

        for i, page in enumerate(pdf.pages):
            if i % 100 == 0:
                print(f"    Sayfa {i+1}/{total}...")

            tables = page.extract_tables()
            for table in tables:
                if not table: continue
                for row in table:
                    if not row or len(row) < 3: continue
                    cols = [str(c or "").strip() for c in row]

                    poz_no = description = unit = price = None

                    for idx, col in enumerate(cols):
                        clean = re.sub(r'\s*[a-zA-Z]\s*$', '', col.replace("\n", " ")).strip()
                        if is_poz_no(clean):
                            poz_no = clean
                            if idx + 1 < len(cols):
                                description = clean_text(cols[idx + 1])
                            rest = cols[idx + 2:]
                            UNITS = ["m³","m3","m²","m2","ton","Ton","adet","Adet","kg","Kg",
                                     "lt","m","yzm²","100 m²","rm","bm","bm²","set","takım","kw","kwh"]
                            for j, r in enumerate(rest):
                                r_strip = r.strip()
                                if r_strip in UNITS or any(u in r_strip for u in ["m3","m2","m²","m³","ton","kg","adet"]):
                                    unit = r_strip
                                    for k in range(j+1, min(j+4, len(rest))):
                                        p = clean_price(rest[k])
                                        if p and p > 0:
                                            price = p
                                            break
                                    break
                            break

                    if not all([poz_no, description, price]):
                        continue
                    if poz_no in seen:
                        continue
                    seen.add(poz_no)
                    pozlar.append({
                        "poz_no": poz_no,
                        "description": description[:500],
                        "unit": unit or "Adet",
                        "unit_price": price,
                        "fascicle": fascicle,
                    })

    print(f"  {len(pozlar)} poz bulundu.")
    return pozlar

def import_to_db(all_pozlar):
    match = re.match(r'postgresql://([^:]+):([^@]+)@([^:]+):(\d+)/(.+)', DATABASE_URL)
    user, password, host, port, dbname = match.groups()
    conn = psycopg2.connect(host=host, port=int(port), dbname=dbname, user=user, password=password)
    cur = conn.cursor()

    cur.execute('DELETE FROM "PozLibrary" WHERE "institutionName" = %s AND year = %s', (INSTITUTION, YEAR))
    print(f"\n{cur.rowcount} eski poz silindi.")

    inserted = 0
    for poz in all_pozlar:
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
                poz["poz_no"], poz["description"], poz["unit"],
                poz["unit_price"], YEAR, INSTITUTION, poz["fascicle"],
            ))
            inserted += 1
        except Exception as e:
            print(f"  Hata ({poz['poz_no']}): {e}")

    conn.commit()
    cur.close()
    conn.close()
    print(f"{inserted} poz veritabanina aktarildi!")

if __name__ == "__main__":
    print("=" * 50)
    print(f"CSB {YEAR} Birim Fiyatlari Import")
    print("=" * 50)

    all_pozlar = []
    for pdf_path, fascicle in PDFS:
        pozlar = extract(pdf_path, fascicle)
        all_pozlar.extend(pozlar)

    print(f"\nToplam: {len(all_pozlar)} poz")
    import_to_db(all_pozlar)
