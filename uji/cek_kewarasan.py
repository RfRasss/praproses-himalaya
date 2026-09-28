"""Pemeriksaan kewarasan hasil praproses.

Ini BUKAN bagian pemodelan. Pemilihan algoritma, penyetelan parameter, dan
evaluasi resmi dikerjakan anggota kelompok yang memegang pemodelan.

Yang diperiksa di sini cuma dua, dan dua-duanya soal kualitas data:

1. Apakah data hasil praproses punya sinyal sama sekali. Kalau model apa pun
   tidak bisa mengalahkan tebakan kelas mayoritas, berarti ada yang salah di
   penggabungan atau pembuatan fitur.

2. Apakah hasilnya justru terlalu bagus. Akurasi di atas 0,95 pada masalah
   seperti ini hampir selalu berarti masih ada kolom bocor yang lolos.

Jalankan dari akar proyek:

    python uji/cek_kewarasan.py
"""

import sys
from pathlib import Path

import pandas as pd
from sklearn.dummy import DummyClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, f1_score, roc_auc_score
from sklearn.pipeline import Pipeline

AKAR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(AKAR))

from praproses.gabung import TARGET  # noqa: E402
from praproses.pipeline import FITUR, buat_praproses  # noqa: E402

BATAS_BAWAH = 0.60  # di bawah ini berarti data hampir tidak berguna
BATAS_ATAS = 0.95  # di atas ini berarti hampir pasti masih ada kebocoran


def main() -> int:
    olahan = AKAR / "data" / "olahan"
    latih = pd.read_parquet(olahan / "latih.parquet")
    uji = pd.read_parquet(olahan / "uji.parquet")
    y_latih, y_uji = latih[TARGET], uji[TARGET]

    kandidat = {
        "tebak kelas mayoritas": DummyClassifier(strategy="most_frequent"),
        "regresi logistik": LogisticRegression(max_iter=1000),
        "random forest": RandomForestClassifier(
            n_estimators=120, n_jobs=-1, random_state=0
        ),
    }

    print(f"Data latih {len(latih):,} baris, data uji {len(uji):,} baris")
    print(f"Berhasil di data uji: {y_uji.mean():.1%}\n")
    print(f"{'model':<24}{'akurasi':>9}{'f1':>8}{'auc':>8}")

    akurasi = {}
    for nama, model in kandidat.items():
        pipa = Pipeline([("praproses", buat_praproses()), ("model", model)])
        pipa.fit(latih[FITUR], y_latih)
        prediksi = pipa.predict(uji[FITUR])
        akurasi[nama] = accuracy_score(y_uji, prediksi)

        if hasattr(pipa, "predict_proba") and nama != "tebak kelas mayoritas":
            peluang = pipa.predict_proba(uji[FITUR])[:, 1]
            auc = f"{roc_auc_score(y_uji, peluang):.3f}"
        else:
            auc = "-"
        f1 = f1_score(y_uji, prediksi, zero_division=0)
        print(f"{nama:<24}{akurasi[nama]:>9.3f}{f1:>8.3f}{auc:>8}")

    terbaik = max(v for k, v in akurasi.items() if k != "tebak kelas mayoritas")
    dasar = akurasi["tebak kelas mayoritas"]

    print()
    masalah = 0
    if terbaik <= dasar:
        print(f"MASALAH: tidak ada model yang mengalahkan garis dasar {dasar:.3f}")
        masalah += 1
    elif terbaik < BATAS_BAWAH:
        print(f"MASALAH: akurasi terbaik {terbaik:.3f} di bawah batas {BATAS_BAWAH}")
        masalah += 1
    elif terbaik > BATAS_ATAS:
        print(f"MASALAH: akurasi terbaik {terbaik:.3f} terlalu tinggi, periksa kebocoran")
        masalah += 1
    else:
        print(f"Wajar: akurasi terbaik {terbaik:.3f}, garis dasar {dasar:.3f}")

    return 1 if masalah else 0


if __name__ == "__main__":
    raise SystemExit(main())
