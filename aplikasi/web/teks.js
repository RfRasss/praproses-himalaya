"use strict";

// Semua kalimat yang dicetak oleh JavaScript ada di sini. Ubah kata-katanya di
// sini saja. Fungsi menerima angka yang sudah diformat, jadi susunan kalimat
// boleh diubah bebas selama nama parameternya dipakai.
// Teks yang tetap ada di index.html. Teks dari API ada di aplikasi/teks.py.
const TEKS = {
  judul: { prediksi: "Prediksi", model: "Kartu model", akhiran: " - Peluang Puncak Himalaya" },

  galat: {
    opsi: "Daftar pilihan tidak bisa dimuat.",
    metrik: "Metrik model tidak bisa dimuat.",
    prediksi: "Prediksi gagal. Coba sekali lagi.",
    server: (kode) => `Server menjawab dengan kode ${kode}.`,
  },

  hasil: {
    kalimat: (dari100, banding) => `Dari 100 pendaki dengan rencana seperti ini, sekitar ${dari100} diperkirakan sampai di puncak, ${banding}.`,
    banding: (arah, rata) => `${arah} rata-rata data uji (${rata})`,
    di_atas: "di atas",
    di_bawah: "di bawah",
    poin: "poin",
  },

  skala: { latih: "latih", uji: "uji" },

  model: {
    ringkas: (pemenang, nLatih, tahun, nUji) =>
      `${pemenang} menang di validasi silang. Modelnya dilatih dengan ${nLatih} baris sampai tahun ${tahun}, lalu diuji dengan ${nUji} baris sesudahnya.`,
    stat: {
      auc: "AUC di data uji: kemampuan membedakan pendaki yang sampai dan tidak (1 sempurna, 0,5 sama dengan menebak)",
      akurasi: (dasar) => `Akurasi di data uji. Menebak kelas terbanyak saja sudah menghasilkan ${dasar}`,
      brier: "Brier di data uji: rata-rata kuadrat selisih prediksi dan kenyataan, makin kecil makin baik",
      f1: "F1 di data uji: gabungan ketepatan dan kelengkapan dalam menebak yang berhasil",
    },
    banding: { kepala: ["Algoritma", "AUC validasi", "AUC uji", "Akurasi uji", "Brier uji"] },
    kelompok: { kepala: ["Kelompok", "Baris uji", "Nyata", "Prediksi", "AUC"], M: "Laki-laki", F: "Perempuan" },
    oksigen: (aucPenuh, aucTanpa) =>
      `Oksigen sangat menentukan. Tanpa dua kolom oksigen, AUC uji turun dari ${aucPenuh} ke ${aucTanpa}. ` +
      "Kami belum memeriksa apakah kolom itu dicatat sebelum atau sesudah hasil pendakian diketahui. Kalau sesudah, sebagian kemampuan model itu bocoran.",
  },

  kalibrasi: {
    sumbuX: "Peluang prediksi (%)",
    sumbuY: "Kejadian nyata (%)",
    titik: (prediksi, nyata) => `Prediksi ${prediksi}, nyata ${nyata}`,
    uraian: (celah, rata, nyata) =>
      `Prediksi di data uji dibagi jadi sepuluh kelompok. Makin dekat titik ke garis putus-putus, makin pas angkanya. Selisih terbesar ${celah} poin persen. ` +
      `Rata-rata prediksi ${rata}, kenyataannya ${nyata}. Model tidak dikalibrasi ulang karena kurvanya sudah dekat diagonal.`,
  },

  geser: {
    latih: "data latih",
    uji: "data uji",
    legenda: "garis: kenyataan, kotak kosong: prediksi",
    titik: (tahun, prediksi, nyata) => `${tahun}: prediksi ${prediksi}, nyata ${nyata}`,
    baca: (tahun, berhasil, baris) => `${tahun}: ${berhasil} berhasil, ${baris} baris`,
    uraian: (latih, uji, lebih, total) =>
      `Tingkat keberhasilan naik dari ${latih} di data latih menjadi ${uji} di data uji. ` +
      `Model terlalu optimis di ${lebih} dari ${total} tahun uji, jadi baca angka per tahun dengan hati-hati.`,
    tabel: ["Tahun uji", "Baris", "Nyata", "Prediksi", "Akurasi", "Brier"],
  },

  // Nama fitur model untuk grafik kepentingan. Kunci = nama kolom di data.
  fitur: {
    oxygen_used: "Pakai oksigen",
    oxygen_used_ekspedisi: "Ekspedisi pakai oksigen",
    height_metres: "Tinggi puncak",
    peak_age_years: "Lama puncak sudah didaki",
    expedition_role: "Peran dalam ekspedisi",
    age: "Usia pendaki",
    hired_staff_count: "Jumlah staf bayaran",
    hired_staff_ratio: "Rasio staf bayaran",
    climbing_status: "Status puncak",
    team_size: "Ukuran tim",
    citizenship: "Kewarganegaraan",
    season: "Musim",
    sex: "Jenis kelamin",
    hired: "Pendaki staf bayaran",
    solo: "Pendakian solo",
    basecamp_month: "Bulan basecamp",
    is_eight_thousander: "Puncak 8000 m",
    first_ascent_country: "Negara pendaki pertama",
    agency_prior_climbers: "Pengalaman agen",
    agency_prior_success_rate: "Rekam jejak agen",
  },

  gunung: {
    basecamp: "Basecamp",
    // Hanya lima puncak punya foto sendiri. Kunci = nama berkas di foto/ tanpa .jpg.
    foto: {
      ever: "Everest dan Nuptse dari Kala Patthar",
      lhot: "Everest, Lhotse, dan Nuptse",
      amad: "Ama Dablam",
      choy: "Cho Oyu",
      maka: "Makalu dan Chamlang",
      umum: "Pumori",
    },
    alt: (isi) => `${isi}, Himalaya`,
    altPengganti: (isi) => `${isi}, foto pengganti`,
    keterangan: (foto, puncak) => `Foto: ${foto}. ${puncak} belum punya foto sendiri.`,
  },
};
