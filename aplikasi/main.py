"""API dan halaman web. Jalankan: uvicorn aplikasi.main:app"""

from pathlib import Path
from typing import Literal

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from . import layanan
from .katalog import katalog

WEB = Path(__file__).parent / "web"
MUSIM = Literal["Spring", "Autumn", "Winter", "Summer"]

app = FastAPI(title="Peluang puncak Himalaya")


class Masukan(BaseModel):
    peak_id: str
    season: MUSIM
    age: int = Field(ge=10, le=90)
    sex: Literal["M", "F"]
    citizenship: str
    role: str
    team_size: int = Field(ge=1, le=99)
    hired_staff: int = Field(ge=0, le=99)
    hired: bool = False
    solo: bool = False
    oxygen: bool


@app.get("/api/opsi")
def opsi():
    k = katalog()
    return {
        "puncak": [
            {"id": i, "nama": r.nama, "tinggi": r.tinggi, "n": int(r.n), "berhasil": float(r.berhasil)}
            for i, r in k["puncak"].iterrows()
        ],
        "peran": k["peran"],
        "negara": k["negara"],
        "musim": list(k["bulan_musim"]),
    }


@app.post("/api/prediksi")
def prediksi(masukan: Masukan):
    m = masukan.model_dump()
    k = katalog()
    for kolom, daftar in (("citizenship", k["negara"]), ("role", k["peran"])):
        if m[kolom] not in daftar:
            raise HTTPException(422, {"kode": "tidak_dikenal", "kolom": kolom})
    if m["peak_id"] not in k["puncak"].index:
        raise HTTPException(422, {"kode": "tidak_dikenal", "kolom": "peak_id"})
    dasar = layanan.peluang(m)
    return {
        "peluang": dasar,
        "skenario": layanan.skenario(m, dasar),
        "peringatan": layanan.peringatan(m),
    }


@app.get("/api/model")
def model():
    return layanan.metrik()


@app.get("/")
def beranda():
    return FileResponse(WEB / "index.html", headers={"Cache-Control": "no-cache"})


class StatisTanpaSimpan(StaticFiles):
    """Berkas statis selalu divalidasi ulang, supaya browser tidak memakai CSS lama."""

    async def get_response(self, path, scope):
        r = await super().get_response(path, scope)
        r.headers["Cache-Control"] = "no-cache"
        return r


app.mount("/", StatisTanpaSimpan(directory=WEB), name="web")
