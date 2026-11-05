# Zenith: satu kontainer, satu proses. Model dilatih saat image dibangun, jadi
# versi scikit-learn yang melatih sama dengan yang memuat.
FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 PIP_NO_CACHE_DIR=1
WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY praproses ./praproses
COPY pemodelan ./pemodelan
COPY aplikasi ./aplikasi
COPY data/olahan ./data/olahan
RUN python -m pemodelan.latih

RUN useradd --create-home zenith && chown -R zenith /app
USER zenith

EXPOSE 8000
# Host seperti Render dan Fly mengisi PORT sendiri. Tanpa itu, pakai 8000.
CMD ["sh", "-c", "uvicorn aplikasi.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
