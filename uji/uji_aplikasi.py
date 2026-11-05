"""Pengujian API dan model.

Jalankan dari akar proyek, setelah `python -m pemodelan.latih`:

    python uji/uji_aplikasi.py
"""

import sys
from pathlib import Path

AKAR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(AKAR))

from fastapi.testclient import TestClient  # noqa: E402

from aplikasi.layanan import metrik  # noqa: E402
from aplikasi.main import app  # noqa: E402

lulus = 0
gagal = 0


def periksa(nama: str, syarat: bool, keterangan: str = "") -> None:
    global lulus, gagal
    if syarat:
        lulus += 1
        print(f"  LULUS  {nama}")
    else:
        gagal += 1
        print(f"  GAGAL  {nama}" + (f"  ({keterangan})" if keterangan else ""))


DASAR = dict(peak_id="EVER", season="Spring", age=35, sex="M", citizenship="Japan",
             role="Climber", team_size=9, hired_staff=3, oxygen=True)


def main() -> int:
    c = TestClient(app)

    print("1. Pilihan formulir")
    o = c.get("/api/opsi").json()
    periksa("puncak, peran, negara, musim terisi", all(o[k] for k in ("puncak", "peran", "negara", "musim")))
    periksa("Everest ada di daftar", any(p["id"] == "EVER" for p in o["puncak"]))
    periksa("musim punya id dan nama", all({"id", "nama"} <= set(m) for m in o["musim"]))

    print("\n2. Prediksi")
    r = c.post("/api/prediksi", json=DASAR)
    d = r.json()
    periksa("status 200", r.status_code == 200)
    periksa("peluang di antara 0 dan 1", 0 <= d["peluang"] <= 1)
    periksa("skenario terurut dari selisih terbesar",
            [abs(s["selisih"]) for s in d["skenario"]] == sorted((abs(s["selisih"]) for s in d["skenario"]), reverse=True))
    periksa("skenario tidak mengulang kondisi sekarang", all(s["label"] != "Musim semi" for s in d["skenario"]))
    tanpa = c.post("/api/prediksi", json={**DASAR, "oxygen": False}).json()["peluang"]
    periksa("tanpa oksigen peluang Everest turun jauh", tanpa < d["peluang"] - 0.3,
            f"{tanpa:.2f} lawan {d['peluang']:.2f}")

    print("\n3. Masukan yang salah ditolak")
    for nama, ubah in [("usia di bawah batas", {"age": 3}), ("tim nol", {"team_size": 0}),
                       ("musim tak dikenal", {"season": "Monsoon"}), ("negara tak dikenal", {"citizenship": "Atlantis"}),
                       ("peran tak dikenal", {"role": "Wizard"}), ("puncak tak dikenal", {"peak_id": "XXXX"})]:
        periksa(nama + " memberi 422", c.post("/api/prediksi", json={**DASAR, **ubah}).status_code == 422)

    print("\n4. Peringatan di luar sebaran")
    periksa("usia 12 memicu peringatan", bool(c.post("/api/prediksi", json={**DASAR, "age": 12}).json()["peringatan"]))
    periksa("masukan wajar tanpa peringatan", d["peringatan"] == [])
    periksa("solo dengan tim besar memicu peringatan",
            bool(c.post("/api/prediksi", json={**DASAR, "solo": True}).json()["peringatan"]))

    print("\n5. Metrik tersimpan")
    m = metrik()
    ada = m["model"][m["pemenang"]]["uji"]
    periksa("pemenang mengalahkan garis dasar", ada["akurasi"] > m["garis_dasar_uji"] + 0.1)
    periksa("pemenang dipilih dari validasi silang, bukan dari data uji",
            m["pemenang"] == max(m["model"], key=lambda n: m["model"][n]["auc_cv_rata"]))
    periksa("kurva kalibrasi terisi", len(m["kalibrasi"]) >= 5)

    print(f"\nHasil: {lulus} lulus, {gagal} gagal")
    return 1 if gagal else 0


if __name__ == "__main__":
    raise SystemExit(main())
