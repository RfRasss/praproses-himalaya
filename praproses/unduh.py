"""Unduh tiga berkas mentah Himalayan Database dari cermin TidyTuesday."""

import shutil
import ssl
from pathlib import Path
from urllib.error import URLError
from urllib.request import urlopen

BASIS = (
    "https://raw.githubusercontent.com/rfordatascience/tidytuesday/"
    "main/data/2020/2020-09-22"
)

BERKAS = ("members", "expeditions", "peaks")

PERCOBAAN = 3
BATAS_WAKTU = 60


def _konteks_ssl() -> ssl.SSLContext:
    """Siapkan konteks SSL yang juga jalan di Python bawaan Anaconda.

    Python yang dipasang lewat Anaconda tidak selalu menemukan sertifikat akar
    milik sistem, dan unduhan gagal dengan CERTIFICATE_VERIFY_FAILED padahal
    jaringannya sehat. Paket certifi membawa daftar sertifikatnya sendiri dan
    menyelesaikan masalah itu. Kalau certifi tidak terpasang, kita pakai
    bawaan Python, yang memang sudah cukup di sebagian besar sistem.
    """
    try:
        import certifi

        return ssl.create_default_context(cafile=certifi.where())
    except ImportError:
        return ssl.create_default_context()


def unduh(folder: Path, paksa: bool = False) -> dict[str, Path]:
    """Unduh members.csv, expeditions.csv, dan peaks.csv ke `folder`.

    Berkas yang sudah ada dilewati kecuali `paksa` bernilai True.
    Mengembalikan peta nama berkas ke lokasinya di disk.
    """
    folder.mkdir(parents=True, exist_ok=True)
    konteks = _konteks_ssl()
    hasil = {}

    for nama in BERKAS:
        tujuan = folder / f"{nama}.csv"
        if tujuan.exists() and not paksa:
            hasil[nama] = tujuan
            continue

        alamat = f"{BASIS}/{nama}.csv"
        galat_terakhir: Exception | None = None

        for _ in range(PERCOBAAN):
            try:
                with urlopen(alamat, timeout=BATAS_WAKTU, context=konteks) as sumber:
                    with tujuan.open("wb") as berkas:
                        shutil.copyfileobj(sumber, berkas)
                break
            except (URLError, OSError) as galat:
                galat_terakhir = galat
                tujuan.unlink(missing_ok=True)
        else:
            raise RuntimeError(
                f"Gagal mengunduh {alamat} setelah {PERCOBAAN} percobaan.\n"
                f"Penyebab terakhir: {galat_terakhir}\n\n"
                "Kalau jaringan Anda sehat tapi tetap gagal, unduh ketiga berkas "
                f"secara manual ke folder {folder} :\n"
                + "\n".join(f"  {BASIS}/{n}.csv" for n in BERKAS)
            ) from galat_terakhir

        hasil[nama] = tujuan

    return hasil
