"""Penggabungan tiga tabel Himalayan Database dan pembuangan kolom bocor.

Nama fungsi dan variabel memakai bahasa Indonesia. Nama kolom dibiarkan
sama persis seperti sumbernya supaya masih bisa dicocokkan langsung dengan
kamus data resmi TidyTuesday dan Himalayan Database.
"""

from pathlib import Path

import pandas as pd

# Kolom yang baru terisi SETELAH hasil pendakian diketahui. Semuanya dibuang
# sebelum pemodelan. Lihat catatan-praproses.md bagian "Kebocoran target".
BOCOR_ANGGOTA = [
    "highpoint_metres",
    "died",
    "death_cause",
    "death_height_metres",
    "injured",
    "injury_type",
    "injury_height_metres",
]

BOCOR_EKSPEDISI = [
    "highpoint_metres",
    "highpoint_date",
    "termination_date",
    "termination_reason",
    "member_deaths",
    "hired_staff_deaths",
]

# Kolom ekspedisi yang dipakai. peak_id, peak_name, dan season sengaja tidak
# diambil karena sudah ada di tabel anggota dan isinya sama.
PAKAI_EKSPEDISI = [
    "expedition_id",
    "year",
    "basecamp_date",
    "members",
    "hired_staff",
    "oxygen_used",
    "trekking_agency",
]

PAKAI_PUNCAK = [
    "peak_id",
    "height_metres",
    "climbing_status",
    "first_ascent_year",
    "first_ascent_country",
]

TARGET = "success"


def muat(folder: Path) -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """Baca tiga berkas mentah apa adanya, tanpa perubahan."""
    anggota = pd.read_csv(folder / "members.csv")
    ekspedisi = pd.read_csv(folder / "expeditions.csv")
    puncak = pd.read_csv(folder / "peaks.csv")
    return anggota, ekspedisi, puncak


def gabungkan(
    anggota: pd.DataFrame, ekspedisi: pd.DataFrame, puncak: pd.DataFrame
) -> pd.DataFrame:
    """Gabungkan anggota dengan ekspedisi dan puncak.

    Penggabungan ke tabel ekspedisi memakai kunci gabungan
    (expedition_id, year), bukan expedition_id saja.

    Alasannya: expedition_id KANG10101 muncul dua kali di tabel ekspedisi,
    untuk tahun 1910 dan 2010, karena kode ekspedisi hanya menyimpan dua digit
    tahun. Kalau digabung dengan expedition_id saja, tujuh anggota ekspedisi
    itu berlipat jadi empat belas baris dan jumlah total naik dari 76.519 jadi
    76.526. Kunci gabungan (expedition_id, year) unik dan menghilangkan
    pelipatan itu.
    """
    kiri = anggota.drop(columns=BOCOR_ANGGOTA, errors="ignore")

    kanan_ekspedisi = ekspedisi.drop(columns=BOCOR_EKSPEDISI, errors="ignore")
    kanan_ekspedisi = kanan_ekspedisi[PAKAI_EKSPEDISI]

    gabung = kiri.merge(
        kanan_ekspedisi,
        on=["expedition_id", "year"],
        how="left",
        suffixes=("", "_ekspedisi"),
        validate="many_to_one",
    )

    gabung = gabung.merge(
        puncak[PAKAI_PUNCAK],
        on="peak_id",
        how="left",
        validate="many_to_one",
    )

    return gabung
