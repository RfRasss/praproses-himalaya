"""Jalankan seluruh tahap praproses dari data mentah sampai berkas siap latih.

Cara pakai:

    python jalankan.py

Keluarannya ada tiga di data/olahan/:
    himalaya_bersih.parquet  seluruh baris setelah digabung dan diberi fitur
    latih.parquet            tahun 2012 ke bawah
    uji.parquet              tahun 2013 ke atas

Plus catatan/ringkasan-data.md yang berisi angka-angka untuk slide.
"""

from pathlib import Path

import pandas as pd

from praproses.fitur import tambah_fitur
from praproses.gabung import TARGET, muat, gabungkan
from praproses.pembagian import (
    KOLOM_KUNCI,
    TAHUN_POTONG,
    bagi_berdasarkan_waktu,
    tambah_kunci_ekspedisi,
)
from praproses.pipeline import FITUR, KATEGORIK, NUMERIK
from praproses.unduh import unduh

AKAR = Path(__file__).parent
MENTAH = AKAR / "data" / "mentah"
OLAHAN = AKAR / "data" / "olahan"
CATATAN = AKAR / "catatan"


def ringkas(df: pd.DataFrame, latih: pd.DataFrame, uji: pd.DataFrame) -> str:
    """Susun ringkasan angka yang dipakai di laporan dan slide."""
    baris = []
    tulis = baris.append

    tulis("# Ringkasan data hasil praproses\n")
    tulis("Berkas ini dibuat otomatis oleh `jalankan.py`. Jangan disunting tangan.\n")

    tulis("## Ukuran\n")
    tulis(f"- Baris seluruhnya: {len(df):,}")
    tulis(f"- Kolom seluruhnya: {df.shape[1]}")
    tulis(f"- Fitur yang masuk model: {len(FITUR)} ({len(NUMERIK)} numerik, {len(KATEGORIK)} kategorik)")
    tulis(f"- Ekspedisi unik: {df[KOLOM_KUNCI].nunique():,}")
    tulis(f"- Puncak unik: {df['peak_id'].nunique():,}")
    tulis(f"- Rentang tahun: {int(df['year'].min())} sampai {int(df['year'].max())}\n")

    tulis("## Sebaran target\n")
    n_sukses = int(df[TARGET].sum())
    tulis(f"- Berhasil: {n_sukses:,} ({n_sukses / len(df):.1%})")
    tulis(f"- Gagal: {len(df) - n_sukses:,} ({1 - n_sukses / len(df):.1%})")
    tulis(f"- Garis dasar tebak kelas mayoritas: {max(n_sukses, len(df) - n_sukses) / len(df):.1%}\n")

    tulis(f"## Pembagian waktu (batas tahun {TAHUN_POTONG})\n")
    tulis(f"- Latih: {len(latih):,} baris ({len(latih) / len(df):.1%}), berhasil {latih[TARGET].mean():.1%}")
    tulis(f"- Uji: {len(uji):,} baris ({len(uji) / len(df):.1%}), berhasil {uji[TARGET].mean():.1%}")
    tumpang = set(latih[KOLOM_KUNCI]) & set(uji[KOLOM_KUNCI])
    tulis(f"- Ekspedisi yang muncul di kedua sisi: {len(tumpang)}\n")

    tulis("## Nilai kosong pada fitur model\n")
    kosong = df[FITUR].isna().sum()
    kosong = kosong[kosong > 0].sort_values(ascending=False)
    if kosong.empty:
        tulis("Tidak ada.\n")
    else:
        for nama, jumlah in kosong.items():
            tulis(f"- `{nama}`: {int(jumlah):,} ({jumlah / len(df):.1%})")
        tulis("")

    tulis("## Keberhasilan per dekade\n")
    dekade = df.assign(dekade=(df["year"] // 10) * 10).groupby("dekade")[TARGET]
    for tahun, kelompok in dekade:
        tulis(f"- {int(tahun)}-an: {len(kelompok):,} pendaki, berhasil {kelompok.mean():.1%}")
    tulis("")

    return "\n".join(baris)


def main() -> None:
    print("Mengunduh data mentah bila belum ada...")
    unduh(MENTAH)

    print("Membaca dan menggabungkan tiga tabel...")
    anggota, ekspedisi, puncak = muat(MENTAH)
    jumlah_awal = len(anggota)
    df = gabungkan(anggota, ekspedisi, puncak)
    assert len(df) == jumlah_awal, (
        f"Penggabungan mengubah jumlah baris: {jumlah_awal} jadi {len(df)}"
    )

    print("Membuat fitur turunan...")
    df = tambah_fitur(df)
    df = tambah_kunci_ekspedisi(df)
    assert len(df) == jumlah_awal, "Pembuatan fitur mengubah jumlah baris"

    print("Membagi data latih dan uji berdasarkan tahun...")
    latih, uji = bagi_berdasarkan_waktu(df)

    OLAHAN.mkdir(parents=True, exist_ok=True)
    CATATAN.mkdir(parents=True, exist_ok=True)

    df.to_parquet(OLAHAN / "himalaya_bersih.parquet", index=False)
    latih.to_parquet(OLAHAN / "latih.parquet", index=False)
    uji.to_parquet(OLAHAN / "uji.parquet", index=False)

    teks = ringkas(df, latih, uji)
    (CATATAN / "ringkasan-data.md").write_text(teks, encoding="utf-8")

    print()
    print(teks)
    print(f"Berkas tersimpan di {OLAHAN}")


if __name__ == "__main__":
    main()
