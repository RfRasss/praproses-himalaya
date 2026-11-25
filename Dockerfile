# Zenith: satu kontainer, satu proses. Model sudah dilatih dan ikut di repositori
# (model/). Versi pustaka dikunci di requirements.txt supaya model tetap terbaca.
# Melatih ulang: python -m pemodelan.latih, lalu commit model/.
FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 PIP_NO_CACHE_DIR=1
WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY praproses ./praproses
COPY aplikasi ./aplikasi
COPY model ./model
COPY data/olahan/himalaya_bersih.parquet ./data/olahan/himalaya_bersih.parquet

RUN useradd --create-home zenith && chown -R zenith /app
USER zenith

EXPOSE 8000
# Host seperti Render dan Fly mengisi PORT sendiri. Tanpa itu, pakai 8000.
CMD ["sh", "-c", "uvicorn aplikasi.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
