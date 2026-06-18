"""
Genel birim fiyat PDF importer — standart 4 kolon (POZ NO | TANIM | BİRİM | FİYAT).
Kullanım: python scripts/import_generic.py <pdf> <institution> <fascicle> <year> [yerel|neon ...]
Örn:     python scripts/import_generic.py dsi.pdf DSİ İnşaat 2026-Ocak yerel neon
"""
import pdfplumber, psycopg2, re, uuid, sys

DBS = {
    "yerel": "postgresql://postgres:!Postgrenopass1@localhost:5432/maliyet_bulut",
    "neon": "postgresql://neondb_owner:npg_unWtQ15NcdSm@ep-old-boat-atnrimef-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require",
}

def clean(s):
    return str(s or "").replace("\n", " ").strip()

def clean_price(s):
    if not s: return None
    s = clean(s).replace(" ", "")
    # Hem "1.229,79" (nokta binlik) hem "2 720,25" (boşluk binlik, boşluk zaten silindi)
    if "," in s:
        s = s.replace(".", "").replace(",", ".")
    try:
        v = float(s)
        return v if v > 0 else None
    except:
        return None

def is_poz(s):
    s = clean(s)
    s = re.sub(r'\s*[a-zA-Z]\s*$', '', s).strip()
    return bool(re.match(r'^(KGM/|İB/)?\d+[\.\d/]*$', s)) and any(c.isdigit() for c in s) and len(s) >= 4

def extract(pdf_path):
    pozlar, seen = [], set()
    UNITS = {"m³","m3","m²","m2","ton","Ton","adet","Adet","kg","Kg","sa","lt","m",
             "yzm²","100 m²","rm","bm","set","takım","kw","kwh","gün","ay"}
    print(f"Okunuyor: {pdf_path}")
    with pdfplumber.open(pdf_path) as pdf:
        print(f"{len(pdf.pages)} sayfa")
        for page in pdf.pages:
            for table in (page.extract_tables() or []):
                for row in table:
                    if not row or len(row) < 3: continue
                    cols = [clean(c) for c in row]
                    # poz no'yu bul
                    pi = None
                    for idx, c in enumerate(cols):
                        if is_poz(c): pi = idx; break
                    if pi is None: continue
                    poz_no = re.sub(r'\s*[a-zA-Z]\s*$', '', cols[pi]).strip()
                    desc = cols[pi+1] if pi+1 < len(cols) else ""
                    rest = cols[pi+2:]
                    unit, price = "", None
                    for j, r in enumerate(rest):
                        if r in UNITS or any(u in r for u in ["m3","m2","m²","m³","kg","ton","adet"]):
                            unit = r
                            for k in range(j+1, len(rest)):
                                price = clean_price(rest[k])
                                if price: break
                            break
                    if price is None:  # birim bulunamadıysa son kolonu fiyat say
                        for r in reversed(rest):
                            price = clean_price(r)
                            if price: break
                    if not desc or not price or poz_no in seen: continue
                    seen.add(poz_no)
                    pozlar.append({"poz_no": poz_no, "description": desc[:500],
                                   "unit": unit or "—", "unit_price": price})
    print(f"{len(pozlar)} poz bulundu.")
    return pozlar

def import_db(pozlar, url, label, inst, fasc, year):
    m = re.match(r'postgresql://([^:]+):([^@]+)@([^:/]+)(?::(\d+))?/([^?]+)', url)
    user, pw, host, port, db = m.groups()
    conn = psycopg2.connect(host=host, port=int(port or 5432), dbname=db, user=user, password=pw,
                            sslmode="require" if "neon" in url else "prefer")
    cur = conn.cursor()
    cur.execute('DELETE FROM "PozLibrary" WHERE "institutionName"=%s AND year=%s', (inst, year))
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
                  p["unit_price"], year, inst, fasc))
            ins += 1
        except Exception as e:
            print(f"  Hata {p['poz_no']}: {e}")
    conn.commit(); cur.close(); conn.close()
    print(f"[{label}] {ins} poz aktarildi.")

if __name__ == "__main__":
    pdf, inst, fasc, year = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]
    targets = sys.argv[5:] or ["yerel", "neon"]
    pozlar = extract(pdf)
    if pozlar:
        for p in pozlar[:4]:
            print(f"  {p['poz_no']} | {p['description'][:42]} | {p['unit']} | {p['unit_price']}")
        for t in targets:
            import_db(pozlar, DBS[t], t, inst, fasc, year)
