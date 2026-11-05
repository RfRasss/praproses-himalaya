"""Semua kalimat yang dihasilkan server. Ubah kata-katanya di sini saja.

Teks halaman ada di aplikasi/web/index.html, dan kalimat yang dicetak
JavaScript ada di aplikasi/web/teks.js.
"""

# Nama musim di formulir dan di nama skenario. Kunci = nilai di data.
MUSIM = {"Spring": "Semi", "Autumn": "Gugur", "Winter": "Dingin", "Summer": "Panas"}

# Nama skenario "apa kalau" di tabel hasil.
TANPA_OKSIGEN = "Tanpa oksigen tambahan"
DENGAN_OKSIGEN = "Dengan oksigen tambahan"
GANTI_MUSIM = "Musim {musim}"
TIM_DUA_KALI = "Tim dua kali lebih besar"
TANPA_STAF = "Tanpa staf bayaran"

# Peringatan masukan di luar sebaran.
USIA_JARANG = "Usia ini jarang di data latih, tebakan kurang bisa diandalkan."
TIM_JARANG = "Ukuran tim ini jarang di data latih, tebakan kurang bisa diandalkan."
SOLO_TIM_BESAR = "Pendakian solo biasanya tim berisi satu orang. Periksa isian Anda."

# Pesan galat API.
TIDAK_DIKENAL = "{kolom} tidak dikenal: {nilai}"
