"""Dari masukan pengguna jadi baris fitur, lalu jadi probabilitas dan skenario."""

from functools import lru_cache
from pathlib import Path
import json

import joblib
import numpy as np
import pandas as pd

from praproses.pipeline import FITUR

from .katalog import TAHUN_RENCANA, katalog

MODEL = Path(__file__).parent.parent / "model"


@lru_cache
def muat_model():
    return joblib.load(MODEL / "model.joblib")


@lru_cache
def metrik() -> dict:
    return json.loads((MODEL / "metrik.json").read_text(encoding="utf-8"))


def bangun_baris(m: dict) -> pd.DataFrame:
    """Terjemahkan masukan formulir ke 20 fitur model.

    Rekam jejak agen sengaja dikosongkan: pengguna tidak punya angkanya, dan
    pipeline mengisinya dengan median data latih.
    """
    k = katalog()
    p = k["puncak"].loc[m["peak_id"]]
    total = m["team_size"] + m["hired_staff"]
    baris = {
        "age": m["age"],
        "team_size": m["team_size"],
        "hired_staff_count": m["hired_staff"],
        "hired_staff_ratio": m["hired_staff"] / total if total else np.nan,
        "basecamp_month": k["bulan_musim"][m["season"]],
        "peak_age_years": TAHUN_RENCANA - p["tahun_pertama"],
        "height_metres": p["tinggi"],
        "is_eight_thousander": float(p["tinggi"] >= 8000),
        "agency_prior_climbers": np.nan,
        "agency_prior_success_rate": np.nan,
        "hired": float(m["hired"]),
        "solo": float(m["solo"]),
        # Satu sakelar oksigen mengisi dua kolom: pemakaian pribadi dan ekspedisi.
        "oxygen_used": float(m["oxygen"]),
        "oxygen_used_ekspedisi": float(m["oxygen"]),
        "season": m["season"],
        "sex": m["sex"],
        "expedition_role": m["role"],
        "citizenship": m["citizenship"],
        "climbing_status": p["status"],
        "first_ascent_country": p["negara_pertama"],
    }
    return pd.DataFrame([baris])[FITUR]


def peluang(m: dict) -> float:
    return float(muat_model().predict_proba(bangun_baris(m))[0, 1])


def skenario(m: dict, dasar: float) -> list[dict]:
    """Ubah satu keputusan rencana, hitung ulang, tunjukkan selisihnya.

    Ini penjelasan per prediksi tanpa pustaka tambahan: pengguna melihat apa
    yang berubah kalau satu hal saja diganti. Selisih ini sifatnya
    prediktif, bukan sebab-akibat. Server hanya mengirim `kode`; kalimatnya
    ada di aplikasi/web/teks.js, dua bahasa.
    """
    pilihan = [("oksigen_tanpa" if m["oxygen"] else "oksigen_dengan", None, {"oxygen": not m["oxygen"]})]
    pilihan += [("musim", s, {"season": s}) for s in katalog()["bulan_musim"] if s != m["season"]]
    pilihan.append(("tim_dua", None, {"team_size": min(m["team_size"] * 2, 99)}))
    pilihan.append(("tanpa_staf", None, {"hired_staff": 0}))

    hasil = []
    for kode, musim, ubah in pilihan:
        if all(m[k] == v for k, v in ubah.items()):
            continue
        p = peluang({**m, **ubah})
        hasil.append({"kode": kode, "musim": musim, "peluang": p, "selisih": p - dasar})
    return sorted(hasil, key=lambda x: -abs(x["selisih"]))


def peringatan(m: dict) -> list[str]:
    r = katalog()["rentang"]
    hasil = []
    if not r["age"][0] <= m["age"] <= r["age"][1]:
        hasil.append("usia_jarang")
    if not r["team_size"][0] <= m["team_size"] <= r["team_size"][1]:
        hasil.append("tim_jarang")
    if m["solo"] and m["team_size"] > 1:
        hasil.append("solo_tim_besar")
    return hasil
