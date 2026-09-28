"""Pembagian data latih dan uji, plus kunci pengelompokan untuk validasi silang.

Dua hal yang ditegakkan di sini:

1. Pembagian berdasarkan waktu, bukan acak. Tingkat keberhasilan naik tajam
   dari 21 persen di dekade 1980-an jadi 49 persen di dekade 2010-an, jadi
   membagi acak berarti melatih model dengan pengetahuan masa depan.

2. Pengelompokan per ekspedisi. Anggota satu ekspedisi menghadapi cuaca, rute,
   dan pemandu yang sama, sehingga hasil mereka saling terkait. Kalau sebagian
   anggota masuk data latih dan sebagian masuk data uji, model seolah sudah
   mengintip jawabannya.
"""

import pandas as pd
from sklearn.model_selection import GroupKFold

# Batas tahun terakhir yang masuk data latih. Dipilih supaya pembagiannya
# mendekati 80:20. Dengan potong di 2012, data latih berisi 77,7 persen baris.
TAHUN_POTONG = 2012

KOLOM_KUNCI = "expedition_key"


def tambah_kunci_ekspedisi(df: pd.DataFrame) -> pd.DataFrame:
    """Buat kunci ekspedisi yang benar-benar unik.

    `expedition_id` saja tidak cukup, karena kode KANG10101 dipakai dua kali,
    untuk 1910 dan 2010. Tahun ditempelkan supaya dua ekspedisi itu tidak
    dianggap satu kelompok.
    """
    hasil = df.copy()
    hasil[KOLOM_KUNCI] = (
        hasil["expedition_id"].astype(str) + "_" + hasil["year"].astype(str)
    )
    return hasil


def bagi_berdasarkan_waktu(
    df: pd.DataFrame, tahun_potong: int = TAHUN_POTONG
) -> tuple[pd.DataFrame, pd.DataFrame]:
    """Pisahkan data latih (tahun <= potong) dan data uji (tahun > potong)."""
    latih = df[df["year"] <= tahun_potong].copy()
    uji = df[df["year"] > tahun_potong].copy()
    return latih, uji


def pembagi_silang(n_lipatan: int = 5) -> GroupKFold:
    """Pembagi validasi silang yang menjaga satu ekspedisi tetap utuh.

    Dipakai oleh anggota kelompok yang mengerjakan pemodelan, dengan
    `groups=latih[KOLOM_KUNCI]`.
    """
    return GroupKFold(n_splits=n_lipatan)
