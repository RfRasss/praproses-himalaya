"""Latih, bandingkan, dan simpan model prediksi keberhasilan mencapai puncak.

Cara pakai:

    python -m pemodelan.latih

Keluaran di model/:
    model.joblib   pipeline pemenang (praproses + model), siap dipakai API
    metrik.json    semua angka evaluasi, dibaca API dan halaman model
"""

import json
from pathlib import Path

import joblib
import pandas as pd
from sklearn.base import clone
from sklearn.calibration import calibration_curve
from sklearn.ensemble import HistGradientBoostingClassifier, RandomForestClassifier
from sklearn.inspection import permutation_importance
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    brier_score_loss,
    f1_score,
    roc_auc_score,
)
from sklearn.model_selection import cross_val_score
from sklearn.pipeline import Pipeline

from praproses.pembagian import KOLOM_KUNCI, TAHUN_POTONG, pembagi_silang
from praproses.pipeline import FITUR, buat_praproses

AKAR = Path(__file__).parent.parent
OLAHAN = AKAR / "data" / "olahan"
KELUAR = AKAR / "model"
ACAK = 0
OKSIGEN = ("oxygen_used", "oxygen_used_ekspedisi")


def kandidat() -> dict[str, Pipeline]:
    """Tiga algoritma yang dibandingkan, semuanya di atas praproses yang sama."""
    return {
        "Regresi logistik": LogisticRegression(max_iter=2000),
        "Random forest": RandomForestClassifier(
            n_estimators=300, min_samples_leaf=5, n_jobs=-1, random_state=ACAK
        ),
        "Gradient boosting": HistGradientBoostingClassifier(
            max_depth=4, learning_rate=0.05, max_iter=300, random_state=ACAK
        ),
    }


def nilai(y, proba) -> dict[str, float]:
    tebak = proba >= 0.5
    return {
        "akurasi": accuracy_score(y, tebak),
        "f1": f1_score(y, tebak),
        "auc": roc_auc_score(y, proba),
        "brier": brier_score_loss(y, proba),
    }


def main() -> None:
    latih = pd.read_parquet(OLAHAN / "latih.parquet")
    uji = pd.read_parquet(OLAHAN / "uji.parquet")
    xl, yl = latih[FITUR], latih["success"]
    xu, yu = uji[FITUR], uji["success"]

    hasil, pipa = {}, {}
    for nama, algoritma in kandidat().items():
        p = Pipeline([("praproses", buat_praproses()), ("model", algoritma)])
        cv = cross_val_score(
            p, xl, yl, groups=latih[KOLOM_KUNCI],
            cv=pembagi_silang(5), scoring="roc_auc", n_jobs=1,
        )
        p.fit(xl, yl)
        hasil[nama] = {
            "auc_cv_rata": cv.mean(),
            "auc_cv_sd": cv.std(),
            "uji": nilai(yu, p.predict_proba(xu)[:, 1]),
        }
        pipa[nama] = p
        print(f"{nama:18s} cv auc {cv.mean():.3f}  uji auc {hasil[nama]['uji']['auc']:.3f}")

    # Pemenang dipilih dari validasi silang di data latih, bukan dari data uji,
    # supaya data uji tetap jadi ujian yang jujur.
    menang = max(hasil, key=lambda n: hasil[n]["auc_cv_rata"])
    model = pipa[menang]
    proba = model.predict_proba(xu)[:, 1]

    frek, rata = calibration_curve(yu, proba, n_bins=10, strategy="quantile")
    kalibrasi = [{"prediksi": float(r), "nyata": float(f)} for f, r in zip(frek, rata, strict=True)]

    pi = permutation_importance(
        model, xu, yu, scoring="roc_auc", n_repeats=5, random_state=ACAK, n_jobs=1
    )
    penting = sorted(
        ({"fitur": f, "turun_auc": float(m)} for f, m in zip(FITUR, pi.importances_mean, strict=True)),
        key=lambda d: -d["turun_auc"],
    )

    per_jk = {
        s: {"n": int(m.sum()), "nyata": float(yu[m].mean()), "prediksi": float(proba[m].mean()),
            "auc": float(roc_auc_score(yu[m], proba[m]))}
        for s in ("M", "F") if (m := (uji["sex"] == s).to_numpy()).sum() > 50
    }

    semua = pd.read_parquet(OLAHAN / "himalaya_bersih.parquet")
    per_tahun = [
        {"tahun": int(t), "n": int(len(g)), "berhasil": float(g["success"].mean())}
        for t, g in semua[semua["year"] >= 1970].groupby("year")
    ]
    uji_tahun = uji.assign(proba=proba)
    per_tahun_uji = [
        {"tahun": int(t), "n": int(len(g)), "nyata": float(g["success"].mean()),
         "prediksi": float(g["proba"].mean()),
         "akurasi": float(accuracy_score(g["success"], g["proba"] >= 0.5)),
         "brier": float(brier_score_loss(g["success"], g["proba"]))}
        for t, g in uji_tahun.groupby("year")
    ]

    # Oksigen mendominasi kepentingan fitur. Latih ulang tanpa dua kolomnya
    # untuk tahu seberapa jauh model bergantung padanya.
    ct = clone(model.named_steps["praproses"])
    ct.transformers = [(n, t, [c for c in kol if c not in OKSIGEN]) for n, t, kol in ct.transformers]
    tanpa = Pipeline([("praproses", ct), ("model", clone(model.named_steps["model"]))])
    tanpa.fit(xl, yl)
    auc_tanpa_oksigen = float(roc_auc_score(yu, tanpa.predict_proba(xu)[:, 1]))

    garis_dasar = float(max(yu.mean(), 1 - yu.mean()))
    metrik = {
        "pemenang": menang,
        "tahun_potong": TAHUN_POTONG,
        "n_latih": len(latih),
        "n_uji": len(uji),
        "garis_dasar_uji": garis_dasar,
        "berhasil_latih": float(yl.mean()),
        "berhasil_uji": float(yu.mean()),
        "model": hasil,
        "kalibrasi": kalibrasi,
        "kepentingan": penting,
        "per_jenis_kelamin": per_jk,
        "auc_tanpa_oksigen": auc_tanpa_oksigen,
        "per_tahun": per_tahun,
        "per_tahun_uji": per_tahun_uji,
        "tebak_rata_uji": float(proba.mean()),
    }

    KELUAR.mkdir(exist_ok=True)
    joblib.dump(model, KELUAR / "model.joblib", compress=3)
    (KELUAR / "metrik.json").write_text(
        json.dumps(metrik, indent=2, default=float), encoding="utf-8"
    )
    print(f"Pemenang: {menang}. Tersimpan di {KELUAR}")


if __name__ == "__main__":
    main()
