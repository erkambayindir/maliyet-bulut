"""
KGM (Karayolları) 2026 Birim Fiyat Listesi import.
Format: POZ NO | İŞİN ADI | ÖLÇÜ BİRİMİ | İHALELİ BİRİM FİYATI (boşluk binlik, virgül ondalık)
Hem yerel hem Neon'a yazar.
"""
import pdfplumber, psycopg2, re, uuid, sys
from db_config import DBS

PDF_PATH = r"C:\Users\ff\Downloads\kurumlar\kgm_birim_fiyat.pdf"
YEAR = "2026-Ocak"
INSTITUTION = "KGM"
FASCICLE = "Yapım"

def clean_price(s):
    if not s: return None
    s = str(s).replace("\n", " ").strip()
    # "2 720,25" -> boşlukları ve noktaları (binlik) kaldır, virgül -> nokta
    s = s.replace(" ", "").replace(".", "").replace(",", ".")
    try:
        v = float(s)
        return v if v > 0 else None
    except:
        return None

def clean(s):
    return str(s or "").replace("\n", " ").strip()

def is_poz(s):
    s = clean(s)
    # KGM/03.542/5 veya 03.543 veya 03.543/2
    return bool(re.match(r'^(KGM/)?\d+[\.\d/]*$', s)) and any(c.isdigit() for c in s) and len(s) >= 4

def extract():
    pozlar, seen = [], set()
    print(f"PDF okunuyor: {PDF_PATH}")
    with pdfplumber.open(PDF_PATH) as pdf:
        print(f"{len(pdf.pages)} sayfa")
        for i, page in enumerate(pdf.pages):
            for table in (page.extract_tables() or []):
                for row in table:
                    if not row or len(row) < 4: continue
                    cols = [clean(c) for c in row]
                    poz_no = cols[0]
                    if not is_poz(poz_no): continue
                    desc = cols[1] if len(cols) > 1 else ""
                    unit = cols[2] if len(cols) > 2 else ""
                    # fiyat son kolonda
                    price = None
                    for c in reversed(cols[3:]):
                        price = clean_price(c)
                        if price: break
                    if not desc or not price: continue
                    if poz_no in seen: continue
                    seen.add(poz_no)
                    pozlar.append({"poz_no": poz_no, "description": desc[:500],
                                   "unit": unit or "—", "unit_price": price})
    print(f"{len(pozlar)} poz bulundu.")
    return pozlar

def import_db(pozlar, url, label):
    m = re.match(r'postgresql://([^:]+):([^@]+)@([^:/]+)(?::(\d+))?/([^?]+)', url)
    user, pw, host, port, db = m.groups()
    conn = psycopg2.connect(host=host, port=int(port or 5432), dbname=db, user=user, password=pw,
                            sslmode="require" if "neon" in url else "prefer")
    cur = conn.cursor()
    cur.execute('DELETE FROM "PozLibrary" WHERE "institutionName"=%s AND year=%s', (INSTITUTION, YEAR))
    ins = 0
    for p in pozlar:
        try:
            cur.execute("""
                INSERT INTO "PozLibrary" (id,"pozNo",description,unit,"unitPrice",year,"institutionName","fascicleName")
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
                ON CONFLICT ("pozNo",year,"institutionName") DO UPDATE
                SET description=EXCLUDED.description, unit=EXCLUDED.unit,
                    "unitPrice"=EXCLUDED."unitPrice", "fascicleName"=EXCLUDED."fascicleName"
            """, (str(uuid.uuid4()), p["poz_no"], p["description"], p["unit"],
                  p["unit_price"], YEAR, INSTITUTION, FASCICLE))
            ins += 1
        except Exception as e:
            print(f"  Hata {p['poz_no']}: {e}")
    conn.commit(); cur.close(); conn.close()
    print(f"[{label}] {ins} poz aktarildi.")

if __name__ == "__main__":
    pozlar = extract()
    if pozlar:
        print("Örnekler:")
        for p in pozlar[:4]:
            print(f"  {p['poz_no']} | {p['description'][:45]} | {p['unit']} | {p['unit_price']}")
        targets = sys.argv[1:] or ["yerel", "neon"]
        for t in targets:
            import_db(pozlar, DBS[t], t)
