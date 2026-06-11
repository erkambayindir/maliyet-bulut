"""
Masaüstündeki Mayıs PDF'ini 2026-Haziran / İnşaat olarak import eder.
Sadece İnşaat fasiküldeki 422 poz silinip yerine 1598 poz yazılır.
"""
import pdfplumber, psycopg2, re, uuid

PDF_PATH    = r"C:\Users\ff\Downloads\Cevre Sehircilik Bakanlıgı Birim Fiyatları.pdf"
DB_URL      = "postgresql://postgres:!Postgrenopass1@localhost:5432/maliyet_bulut"
YEAR        = "2026-Haziran"
INSTITUTION = "ÇŞB"
FASCICLE    = "İnşaat"

def clean_price(s):
    if not s: return None
    s = str(s).strip().replace(".", "").replace(",", ".")
    try:
        v = float(s)
        return v if v > 0 else None
    except:
        return None

def is_poz(s):
    s = re.sub(r'\s*[a-zA-Z]\s*$', '', str(s or "").strip())
    return bool(re.match(r'^\d{2,}[\.\d]+$', s)) and len(s) >= 5

def extract(pdf_path):
    pozlar, seen = [], set()
    print(f"PDF okunuyor ({pdf_path})...")
    with pdfplumber.open(pdf_path) as pdf:
        print(f"Toplam {len(pdf.pages)} sayfa")
        for i, page in enumerate(pdf.pages):
            if i % 100 == 0: print(f"  Sayfa {i+1}...")
            for table in (page.extract_tables() or []):
                for row in table:
                    if not row or len(row) < 3: continue
                    cols = [str(c or "").strip() for c in row]
                    poz_no = desc = unit = price = None
                    for idx, col in enumerate(cols):
                        clean = re.sub(r'\s*[a-zA-Z]\s*$', '', col.replace("\n"," ")).strip()
                        if is_poz(clean):
                            poz_no = clean
                            if idx+1 < len(cols): desc = cols[idx+1].replace("\n"," ").strip()
                            UNITS = ["m³","m3","m²","m2","ton","Ton","adet","Adet","kg","Kg",
                                     "lt","m","yzm²","100 m²","rm","bm","set","takım"]
                            for j, r in enumerate(cols[idx+2:], idx+2):
                                if r.strip() in UNITS or any(u in r for u in ["m3","m2","m²","m³","ton","kg","adet"]):
                                    unit = r.strip()
                                    for k in range(j+1, min(j+4, len(cols))):
                                        p = clean_price(cols[k])
                                        if p and p > 0: price = p; break
                                    break
                            break
                    if poz_no and desc and price and poz_no not in seen:
                        seen.add(poz_no)
                        pozlar.append({"poz_no": poz_no, "description": desc[:500],
                                       "unit": unit or "Adet", "unit_price": price})
    print(f"{len(pozlar)} poz bulundu.")
    return pozlar

def import_db(pozlar):
    m = re.match(r'postgresql://([^:]+):([^@]+)@([^:]+):(\d+)/(.+)', DB_URL)
    user, pw, host, port, db = m.groups()
    conn = psycopg2.connect(host=host, port=int(port), dbname=db, user=user, password=pw)
    cur = conn.cursor()

    cur.execute('DELETE FROM "PozLibrary" WHERE "institutionName"=%s AND year=%s AND "fascicleName"=%s',
                (INSTITUTION, YEAR, FASCICLE))
    print(f"{cur.rowcount} eski poz silindi.")

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
    print(f"{ins} poz aktarildi!")

if __name__ == "__main__":
    pozlar = extract(PDF_PATH)
    import_db(pozlar)
