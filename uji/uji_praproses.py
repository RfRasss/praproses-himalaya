"""Pengujian praproses.

Jalankan dari akar proyek:

    python uji/uji_praproses.py

Yang diperiksa bukan sekadar "kodenya jalan", tapi hal-hal yang kalau salah
akan merusak hasil pemodelan tanpa memunculkan pesan galat apa pun.
"""

import sys
from pathlib import Path

import numpy as np
import pandas as pd

AKAR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(AKAR))

from praproses.fitur import tambah_fitur  # noqa: E402
from praproses.gabung import (  # noqa: E402
    BOCOR_ANGGOTA,
    BOCOR_EKSPEDISI,
    TARGET,
    gabungkan,
    muat,
)
from praproses.pembagian import (  # noqa: E402
    KOLOM_KUNCI,
    bagi_berdasarkan_waktu,
    tambah_kunci_ekspedisi,
)
from praproses.pipeline import FITUR, buat_praproses  # noqa: E402

MENTAH = AKAR / "data" / "mentah"

lulus = 0
gagal = 0


def periksa(nama: str, syarat: bool, keterangan: str = "") -> None:
    global lulus, gagal
    if syarat:
        lulus += 1
        print(f"  LULUS  {nama}")
    else:
        gagal += 1
        print(f"  GAGAL  {nama}")
        if keterangan:
            print(f"         {keterangan}")


def main() -> int:
    anggota, ekspedisi, puncak = muat(MENTAH)
    gabung = gabungkan(anggota, ekspedisi, puncak)
    df = tambah_kunci_ekspedisi(tambah_fitur(gabung))
    latih, uji = bagi_berdasarkan_waktu(df)

    print("\n1. Penggabungan tidak melipatgandakan baris")
    periksa(
        "jumlah baris sama dengan tabel anggota",
        len(gabung) == len(anggota),
        f"{len(gabung)} berbanding {len(anggota)}",
    )
    naif = anggota.merge(ekspedisi, on="expedition_id", suffixes=("", "_e"))
    periksa(
        "penggabungan naif memang bermasalah, jadi kunci gabungan perlu",
        len(naif) > len(anggota),
        f"penggabungan naif menghasilkan {len(naif)} baris",
    )
    periksa("member_id tetap unik setelah digabung", not gabung["member_id"].duplicated().any()
            or gabung["member_id"].duplicated().sum() == anggota["member_id"].duplicated().sum(),
            "duplikat bertambah setelah penggabungan")

    print("\n2. Kolom bocor benar-benar hilang")
    for kolom in set(BOCOR_ANGGOTA) | set(BOCOR_EKSPEDISI):
        periksa(f"kolom `{kolom}` tidak ada", kolom not in df.columns)
    periksa(
        "tidak ada kolom bocor yang menyelinap lewat akhiran _ekspedisi",
        not any(k.startswith(tuple(BOCOR_EKSPEDISI)) for k in df.columns),
    )

    print("\n3. Pembagian latih dan uji")
    periksa("data latih dan uji tidak kosong", len(latih) > 0 and len(uji) > 0)
    periksa(
        "tidak ada ekspedisi yang muncul di latih sekaligus di uji",
        len(set(latih[KOLOM_KUNCI]) & set(uji[KOLOM_KUNCI])) == 0,
    )
    periksa(
        "seluruh tahun uji lebih besar dari tahun latih terakhir",
        uji["year"].min() > latih["year"].max(),
        f"uji mulai {uji['year'].min()}, latih berakhir {latih['year'].max()}",
    )
    periksa("gabungan latih dan uji sama dengan seluruh data", len(latih) + len(uji) == len(df))

    print("\n4. Rekam jejak agen tidak memakai masa depan")
    # Dihitung ulang dengan cara yang berbeda dan lebih lambat, lalu
    # dibandingkan. Kalau dua cara yang berbeda memberi angka yang sama,
    # kemungkinan besar keduanya benar.
    contoh = (
        df[df["agency_prior_success_rate"].notna()]
        .sample(40, random_state=0)
    )
    cocok = True
    for _, baris in contoh.iterrows():
        masa_lalu = df[
            (df["trekking_agency"] == baris["trekking_agency"])
            & (df["year"] < baris["year"])
        ]
        harusnya = masa_lalu[TARGET].mean()
        if not np.isclose(harusnya, baris["agency_prior_success_rate"]):
            cocok = False
            print(
                f"         beda pada {baris['trekking_agency']} tahun {baris['year']}: "
                f"{baris['agency_prior_success_rate']} berbanding {harusnya}"
            )
            break
    periksa("40 baris acak cocok dengan hitungan ulang", cocok)

    tahun_pertama = (
        df[df["trekking_agency"].notna()].groupby("trekking_agency")["year"].min()
    )
    baris_pertama = df["trekking_agency"].map(tahun_pertama) == df["year"]
    periksa(
        "agen di tahun pertamanya selalu bernilai kosong",
        df.loc[baris_pertama & df["trekking_agency"].notna(),
               "agency_prior_success_rate"].isna().all(),
    )

    print("\n5. Nilai janggal tertangani")
    umur_puncak = df["peak_age_years"].dropna()
    periksa(
        "umur puncak berada di rentang masuk akal",
        umur_puncak.max() < 150,
        f"nilai tertinggi {umur_puncak.max()}",
    )
    periksa(
        "tinggi puncak yang kosong tidak dipaksa jadi bukan delapan ribu",
        df.loc[df["height_metres"].isna(), "is_eight_thousander"].isna().all(),
    )
    periksa(
        "umur pendaki ekstrem sengaja dipertahankan",
        df["age"].max() > 80 and df["age"].min() < 15,
        "umur ekstrem seharusnya tidak dibuang",
    )

    print("\n6. Pipeline bisa dipasang pada latih dan dipakai pada uji")
    praproses = buat_praproses()
    x_latih = praproses.fit_transform(latih[FITUR])
    x_uji = praproses.transform(uji[FITUR])
    periksa("jumlah kolom hasil sama antara latih dan uji", x_latih.shape[1] == x_uji.shape[1],
            f"{x_latih.shape[1]} berbanding {x_uji.shape[1]}")
    periksa("tidak ada nilai kosong tersisa setelah pipeline",
            not np.isnan(x_latih).any() and not np.isnan(x_uji).any())
    periksa("jumlah baris tidak berubah",
            x_latih.shape[0] == len(latih) and x_uji.shape[0] == len(uji))

    print("\n7. Pipeline tidak belajar dari data uji")
    hanya_latih = buat_praproses().fit(latih[FITUR])
    dengan_uji = buat_praproses().fit(pd.concat([latih, uji])[FITUR])
    median_latih = hanya_latih.named_transformers_["numerik"].named_steps["isi"].statistics_
    median_semua = dengan_uji.named_transformers_["numerik"].named_steps["isi"].statistics_
    periksa(
        "median pengisi memang berbeda kalau data uji ikut dipelajari",
        not np.allclose(median_latih, median_semua, equal_nan=True),
        "kalau sama, pengujian ini tidak membuktikan apa pun",
    )

    print(f"\nHasil: {lulus} lulus, {gagal} gagal")
    return 1 if gagal else 0


if __name__ == "__main__":
    raise SystemExit(main())
