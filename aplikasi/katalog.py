"""Daftar pilihan formulir, dibaca sekali dari data olahan."""

from functools import lru_cache
from pathlib import Path

import pandas as pd

OLAHAN = Path(__file__).parent.parent / "data" / "olahan"
MIN_BARIS_PUNCAK = 100  # puncak yang lebih jarang dari ini terlalu tipis untuk ditebak
MIN_BARIS_KATEGORI = 50  # sama dengan ambang kategori jarang di pipeline
TAHUN_RENCANA = 2019  # tahun terakhir di data; model tidak punya fitur tahun


@lru_cache
def katalog() -> dict:
    df = pd.read_parquet(OLAHAN / "himalaya_bersih.parquet")

    jumlah = df.groupby("peak_id").size()
    puncak = (
        df[df["peak_id"].isin(jumlah[jumlah >= MIN_BARIS_PUNCAK].index)]
        .groupby("peak_id")
        .agg(
            nama=("peak_name", "first"),
            tinggi=("height_metres", "first"),
            status=("climbing_status", "first"),
            tahun_pertama=("first_ascent_year", "first"),
            negara_pertama=("first_ascent_country", "first"),
            n=("success", "size"),
            berhasil=("success", "mean"),
        )
        .sort_values("n", ascending=False)
    )

    def sering(kolom: str) -> list[str]:
        n = df[kolom].value_counts()
        return n[n >= MIN_BARIS_KATEGORI].index.tolist()

    musim = df[df["season"] != "Unknown"]
    return {
        "puncak": puncak,
        "peran": sering("expedition_role"),
        "negara": sering("citizenship"),
        "bulan_musim": musim.groupby("season")["basecamp_month"].median().round().astype(int).to_dict(),
        "rentang": {
            "age": df["age"].quantile([0.01, 0.99]).tolist(),
            "team_size": df["team_size"].quantile([0.01, 0.99]).tolist(),
        },
    }
