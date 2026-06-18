"""
Import scriptleri için veritabanı bağlantıları — ortam değişkenlerinden okur.
Şifreler ASLA koda gömülmez; .env dosyasından (gitignored) gelir.
"""
import os

# .env dosyasını yükle (varsa)
try:
    from dotenv import load_dotenv
    # proje kökündeki .env
    _root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    load_dotenv(os.path.join(_root, ".env"))
except ImportError:
    pass

DBS = {
    "yerel": os.environ.get("LOCAL_DATABASE_URL") or os.environ.get("DATABASE_URL", ""),
    "neon": os.environ.get("NEON_DATABASE_URL", ""),
}


def get_db(label: str) -> str:
    url = DBS.get(label, "")
    if not url:
        raise RuntimeError(
            f"'{label}' için bağlantı bulunamadı. .env içine "
            f"{'LOCAL_DATABASE_URL' if label == 'yerel' else 'NEON_DATABASE_URL'} ekleyin."
        )
    return url
