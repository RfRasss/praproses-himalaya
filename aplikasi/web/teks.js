"use strict";

// Semua kata di halaman ada di berkas ini, dalam dua bahasa dengan susunan yang
// sama. Ubah kalimatnya di sini saja. Bagian `html` dipasang ke elemen yang
// punya atribut data-t di index.html. Bagian lain dicetak langsung oleh JavaScript.
// Fungsi menerima angka yang sudah diformat, jadi susunan kalimat boleh diubah
// bebas selama nama parameternya dipakai. Kalau menambah kunci di satu bahasa,
// tambahkan juga di bahasa lain.
const SEMUA = {
  id: {
    lokal: "id-ID",

    html: {
      deskripsi: "Model pembelajaran mesin yang menaksir peluang seorang pendaki mencapai puncak Himalaya dari rencana ekspedisinya.",
      merek: "Zenith",
      navLabel: "Halaman",
      bahasaLabel: "Bahasa",
      tab: { prediksi: "Prediksi", model: "Kartu model" },
      tanpaJs: "Halaman ini memerlukan JavaScript untuk menghitung prediksi dan menggambar grafik.",

      hero: {
        judul: "Seberapa besar peluang Anda sampai ke puncak?",
        pengantar: "Pilih sebuah puncak dan isi rencana ekspedisi Anda. Pendaki pada alat ukur di sebelah kanan akan naik sejauh peluang yang dihitung model dari 76.519 catatan pendakian di Himalaya.",
        alat: "Alat ukur ketinggian. Pendaki naik sejauh peluang prediksi.",
      },

      form: {
        puncak: "Puncak",
        musim: "Musim",
        usia: "Usia",
        kelamin: "Jenis kelamin",
        laki: "Laki-laki",
        perempuan: "Perempuan",
        negara: "Kewarganegaraan",
        peran: "Peran dalam ekspedisi",
        tim: "Anggota tim",
        staf: "Staf bayaran",
        oksigen: "Memakai oksigen tambahan",
        staf_saya: "Saya staf bayaran",
        solo: "Pendakian solo",
        geser: "(geser)",
        catatan: "Model memakai 2019 sebagai tahun rencana karena itu tahun terakhir yang ada di data. Rekam jejak agen trekking tidak ditanyakan, sehingga model mengisinya dengan nilai tengah dari data latih.",
      },

      hasil: {
        judul: "Peluang sampai ke puncak",
        memuat: "Sedang menghitung.",
        ulangi: "Coba lagi",
        skala: "Skala peluang dari 0 sampai 100 persen",
        keterangan: "Tanda tebal menunjukkan prediksi Anda dan tanda kecil menunjukkan skenario pada tabel. Dua garis putus-putus adalah rata-rata keberhasilan pada data latih dan data uji.",
        skenario: "Mengubah satu keputusan",
        skenarioPengantar: "Tabel berikut menghitung ulang prediksi setelah satu hal saja diganti, sementara isian lain tetap sama.",
        kepala: { skenario: "Skenario", peluang: "Peluang", selisih: "Selisih" },
        catatan: "Selisih ini hanya membandingkan prediksi model dan tidak membuktikan sebab dan akibat. Oksigen paling berpengaruh pada data ini, tetapi kami belum memeriksa apakah kolomnya dicatat sebelum atau sesudah hasil pendakian diketahui.",
      },

      model: {
        judul: "Seberapa dapat dipercaya angka ini?",
        pengantar: (mulai) => `Halaman ini menjelaskan cara model dinilai, apa saja yang diandalkannya, dan di mana ia bisa keliru. Semua angka dihitung pada data uji, yaitu pendakian tahun ${mulai} ke atas yang tidak pernah dilihat model saat belajar.`,
        banding: "Tiga algoritma diuji bersama",
        bandingCatatan: "Ketiganya memakai praproses yang sama. Pemenang dipilih lewat validasi silang pada data latih, dengan setiap ekspedisi tetap utuh di satu sisi, sehingga data uji baru dipakai satu kali pada akhir.",
        kalibrasi: "Apakah 70% benar-benar 70%?",
        kalibrasiAlat: "Diagram reliabilitas: peluang prediksi dibandingkan dengan kejadian nyata",
        geser: "Pendakian makin sering berhasil",
        geserAlat: "Tingkat keberhasilan per tahun sejak 1970",
        penting: "Apa yang paling diandalkan model",
        pentingAlat: "Penurunan AUC ketika setiap fitur diacak",
        pentingCatatan: "Setiap kolom diacak satu per satu, lalu dilihat seberapa jauh AUC turun. Makin besar penurunannya, makin bergantung model pada kolom itu. Kolom yang saling berkaitan dapat saling menutupi.",
        kelompok: "Hasil menurut jenis kelamin",
        kelompokCatatan: "Pendaki perempuan jauh lebih sedikit, jadi perhatikan kolom jumlah baris sebelum membandingkan. Kewarganegaraan tidak ditampilkan karena banyak negara hanya memiliki beberapa baris.",
        batas: "Batasan",
        batasan: [
          "Aplikasi ini dibuat untuk belajar pembelajaran mesin. Jangan memakainya untuk memutuskan berangkat atau tidak, dan jangan menganggapnya alat keselamatan.",
          "Satu baris data mewakili satu pendaki, sehingga peluangnya milik pendaki tersebut dan bukan milik seluruh ekspedisi.",
          "Data berhenti pada 2019, padahal situs resmi Himalayan Database sudah memuat musim yang lebih baru.",
          "Tingkat keberhasilan jauh lebih tinggi pada data uji daripada data latih. Model tidak memiliki kolom tahun, sehingga perubahan zaman hanya tertangkap lewat lama puncak sudah didaki.",
          "Hanya puncak dengan 100 baris data atau lebih yang dapat dipilih. Rekam jejak agen tidak ditanyakan, sehingga model mengisinya dengan nilai tengah.",
          "Data latih dan data uji dibagi menurut tahun, dan validasi silang menjaga satu ekspedisi tetap utuh. Alasannya tercatat di catatan/keputusan-praproses.md.",
        ],
      },

      kaki: {
        data: "Data: Himalayan Database melalui TidyTuesday, rilis 22 September 2020. Proyek akhir mata kuliah Pembelajaran Mesin.",
        foto: "Foto:",
        sumber: "Wikimedia Commons.",
      },
    },

    judul: { prediksi: "Prediksi", model: "Kartu model", akhiran: " - Zenith" },
    // Nama algoritma dari metrik.json. Kunci = nama di data, nilai = nama yang ditampilkan.
    algoritma: { "Regresi logistik": "Regresi logistik", "Random forest": "Random forest", "Gradient boosting": "Gradient boosting" },
    musim: { Spring: "Semi", Autumn: "Gugur", Winter: "Dingin", Summer: "Panas" },

    galat: {
      opsi: "Daftar pilihan tidak dapat dimuat.",
      metrik: "Angka model tidak dapat dimuat.",
      prediksi: "Prediksi belum berhasil. Silakan coba lagi.",
      server: (kode) => `Server menjawab dengan kode ${kode}.`,
      isian: (kolom) => `Isian "${kolom}" ditolak server. Muat ulang halaman, lalu mulai ulang server bila masih begini.`,
      tidakDikenal: (kolom) => `Nilai untuk "${kolom}" tidak dikenal oleh server.`,
    },

    hasil: {
      kalimat: (dari100, banding) => `Dari 100 pendaki dengan rencana seperti ini, sekitar ${dari100} diperkirakan sampai di puncak, ${banding}.`,
      banding: (arah, rata) => `${arah} rata-rata data uji (${rata})`,
      di_atas: "di atas",
      di_bawah: "di bawah",
      poin: "poin",
      skenario: {
        oksigen_tanpa: "Tanpa oksigen tambahan",
        oksigen_dengan: "Dengan oksigen tambahan",
        musim: (nama) => `Pada musim ${nama.toLowerCase()}`,
        tim_dua: "Tim dua kali lebih besar",
        tanpa_staf: "Tanpa staf bayaran",
      },
      peringatan: {
        usia_jarang: "Usia ini jarang ditemukan pada data latih, sehingga prediksinya kurang dapat diandalkan.",
        tim_jarang: "Ukuran tim ini jarang ditemukan pada data latih, sehingga prediksinya kurang dapat diandalkan.",
        solo_tim_besar: "Pendakian solo biasanya berarti tim beranggota satu orang. Mohon periksa kembali isian Anda.",
      },
    },

    skala: { latih: "latih", uji: "uji" },

    model: {
      ringkas: (pemenang, nLatih, tahun, nUji) =>
        `${pemenang} menang pada validasi silang. Model dilatih dengan ${nLatih} baris sampai tahun ${tahun}, lalu diuji dengan ${nUji} baris sesudahnya.`,
      stat: {
        auc: "AUC pada data uji: kemampuan model membedakan pendaki yang sampai dan yang tidak (1 berarti sempurna, 0,5 sama dengan menebak)",
        akurasi: (dasar) => `Akurasi pada data uji. Menebak hasil yang paling sering terjadi saja sudah menghasilkan ${dasar}`,
        brier: "Skor Brier pada data uji: rata-rata kuadrat selisih antara prediksi dan kenyataan, makin kecil makin baik",
        f1: "F1 pada data uji: gabungan ketepatan dan kelengkapan dalam menebak pendaki yang berhasil",
      },
      banding: { kepala: ["Algoritma", "AUC validasi", "AUC uji", "Akurasi uji", "Brier uji"] },
      kelompok: { kepala: ["Kelompok", "Baris uji", "Kenyataan", "Prediksi", "AUC"], M: "Laki-laki", F: "Perempuan" },
      oksigen: (aucPenuh, aucTanpa) =>
        `Oksigen sangat menentukan. Tanpa dua kolom oksigen, AUC uji turun dari ${aucPenuh} menjadi ${aucTanpa}. ` +
        "Kami belum memeriksa apakah kolom itu dicatat sebelum atau sesudah hasil pendakian diketahui. Bila sesudah, sebagian kemampuan model itu merupakan kebocoran data.",
    },

    kalibrasi: {
      sumbuX: "Peluang prediksi (%)",
      sumbuY: "Kejadian nyata (%)",
      titik: (prediksi, nyata) => `Prediksi ${prediksi}, nyata ${nyata}`,
      uraian: (celah, rata, nyata) =>
        `Prediksi pada data uji dibagi menjadi sepuluh kelompok. Makin dekat sebuah titik ke garis putus-putus, makin tepat angkanya. Selisih terbesar adalah ${celah} poin persen. ` +
        `Rata-rata prediksi ${rata}, sedangkan kenyataannya ${nyata}. Model tidak dikalibrasi ulang karena kurvanya sudah mendekati diagonal.`,
    },

    geser: {
      latih: "data latih",
      uji: "data uji",
      legenda: "garis: kenyataan, kotak kosong: prediksi",
      titik: (tahun, prediksi, nyata) => `${tahun}: prediksi ${prediksi}, nyata ${nyata}`,
      baca: (tahun, berhasil, baris) => `${tahun}: ${berhasil} berhasil, ${baris} baris`,
      uraian: (latih, uji, lebih, total) =>
        `Tingkat keberhasilan naik dari ${latih} pada data latih menjadi ${uji} pada data uji. ` +
        `Model terlalu optimis pada ${lebih} dari ${total} tahun uji, jadi angka per tahun perlu dibaca dengan hati-hati.`,
      tabel: ["Tahun uji", "Baris", "Kenyataan", "Prediksi", "Akurasi", "Brier"],
    },

    // Nama fitur model untuk grafik kepentingan. Kunci = nama kolom di data.
    fitur: {
      oxygen_used: "Memakai oksigen",
      oxygen_used_ekspedisi: "Ekspedisi memakai oksigen",
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
      keterangan: (foto, puncak) => `Foto: ${foto}. ${puncak} belum memiliki foto sendiri.`,
    },
  },

  en: {
    lokal: "en-US",

    html: {
      deskripsi: "A machine learning model that estimates a climber's chance of reaching a Himalayan summit from their expedition plan.",
      merek: "Zenith",
      navLabel: "Pages",
      bahasaLabel: "Language",
      tab: { prediksi: "Prediction", model: "Model card" },
      tanpaJs: "This page needs JavaScript to calculate predictions and draw the charts.",

      hero: {
        judul: "How likely are you to reach the summit?",
        pengantar: "Choose a peak and fill in your expedition plan. The climber on the gauge at the right rises as far as the odds the model calculates from 76,519 climbing records in the Himalaya.",
        alat: "Altitude gauge. The climber rises as far as the predicted odds.",
      },

      form: {
        puncak: "Peak",
        musim: "Season",
        usia: "Age",
        kelamin: "Sex",
        laki: "Male",
        perempuan: "Female",
        negara: "Citizenship",
        peran: "Role in the expedition",
        tim: "Team members",
        staf: "Hired staff",
        oksigen: "Uses supplemental oxygen",
        staf_saya: "I am hired staff",
        solo: "Solo climb",
        geser: "(slide)",
        catatan: "The model uses 2019 as the plan year because it is the last year in the data. The trekking agency's track record is not asked for, so the model fills it with the median of the training data.",
      },

      hasil: {
        judul: "Odds of reaching the summit",
        memuat: "Calculating.",
        ulangi: "Try again",
        skala: "Odds scale from 0 to 100 percent",
        keterangan: "The bold mark is your prediction and the small marks are the scenarios in the table. The two dashed lines are the average success rates in the training and test data.",
        skenario: "Changing one decision",
        skenarioPengantar: "The table below recalculates the prediction after changing just one thing while everything else stays the same.",
        kepala: { skenario: "Scenario", peluang: "Odds", selisih: "Difference" },
        catatan: "These differences only compare the model's predictions and do not prove cause and effect. Oxygen has the strongest effect in this data, but we have not checked whether that column was recorded before or after the outcome of the climb was known.",
      },

      model: {
        judul: "How far can these numbers be trusted?",
        pengantar: (mulai) => `This page explains how the model is judged, what it relies on, and where it can be wrong. Every figure is calculated on the test data: climbs from ${mulai} onward that the model never saw while learning.`,
        banding: "Three algorithms compared",
        bandingCatatan: "All three use the same preprocessing. The winner was chosen by cross-validation on the training data, with each expedition kept whole on one side, so the test data was used only once, at the end.",
        kalibrasi: "Does 70% really mean 70%?",
        kalibrasiAlat: "Reliability diagram: predicted odds compared with actual outcomes",
        geser: "Climbs succeed more often over time",
        geserAlat: "Success rate per year since 1970",
        penting: "What the model relies on most",
        pentingAlat: "Drop in AUC when each feature is shuffled",
        pentingCatatan: "Each column is shuffled in turn to see how far AUC drops. The larger the drop, the more the model depends on that column. Columns that are related can mask one another.",
        kelompok: "Results by sex",
        kelompokCatatan: "There are far fewer female climbers, so look at the row count before comparing. Citizenship is not shown because many countries have only a few rows.",
        batas: "Limitations",
        batasan: [
          "This app was built for learning machine learning. Do not use it to decide whether to go, and do not treat it as a safety tool.",
          "Each row of data is one climber, so the odds belong to that climber and not to the whole expedition.",
          "The data stops in 2019, although the official Himalayan Database website already covers more recent seasons.",
          "The success rate is much higher in the test data than in the training data. The model has no year column, so the change over time is only picked up through how long the peak has been climbed.",
          "Only peaks with 100 or more rows of data can be chosen. The agency's track record is not asked for, so the model fills it with the median.",
          "The training and test data are split by year, and cross-validation keeps each expedition whole. The reasoning is recorded in catatan/keputusan-praproses.md.",
        ],
      },

      kaki: {
        data: "Data: Himalayan Database through TidyTuesday, released 22 September 2020. Final project for the Machine Learning course.",
        foto: "Photos:",
        sumber: "Wikimedia Commons.",
      },
    },

    judul: { prediksi: "Prediction", model: "Model card", akhiran: " - Zenith" },
    algoritma: { "Regresi logistik": "Logistic regression", "Random forest": "Random forest", "Gradient boosting": "Gradient boosting" },
    musim: { Spring: "Spring", Autumn: "Autumn", Winter: "Winter", Summer: "Summer" },

    galat: {
      opsi: "The list of options could not be loaded.",
      metrik: "The model figures could not be loaded.",
      prediksi: "The prediction did not work. Please try again.",
      server: (kode) => `The server answered with code ${kode}.`,
      isian: (kolom) => `The server rejected the "${kolom}" entry. Reload the page, and restart the server if this keeps happening.`,
      tidakDikenal: (kolom) => `The server does not recognise the value for "${kolom}".`,
    },

    hasil: {
      kalimat: (dari100, banding) => `Out of 100 climbers with a plan like this, about ${dari100} are expected to reach the summit, ${banding}.`,
      banding: (arah, rata) => `${arah} the test-data average (${rata})`,
      di_atas: "above",
      di_bawah: "below",
      poin: "points",
      skenario: {
        oksigen_tanpa: "Without supplemental oxygen",
        oksigen_dengan: "With supplemental oxygen",
        musim: (nama) => `In the ${nama.toLowerCase()} season`,
        tim_dua: "A team twice as large",
        tanpa_staf: "Without hired staff",
      },
      peringatan: {
        usia_jarang: "This age is rare in the training data, so the prediction is less reliable.",
        tim_jarang: "This team size is rare in the training data, so the prediction is less reliable.",
        solo_tim_besar: "A solo climb usually means a team of one. Please check your entries.",
      },
    },

    skala: { latih: "training", uji: "test" },

    model: {
      ringkas: (pemenang, nLatih, tahun, nUji) =>
        `${pemenang} won the cross-validation. It was trained on ${nLatih} rows up to ${tahun} and tested on ${nUji} rows after that.`,
      stat: {
        auc: "AUC on the test data: how well the model tells climbers who reach the summit from those who do not (1 is perfect, 0.5 is guessing)",
        akurasi: (dasar) => `Accuracy on the test data. Always guessing the most common outcome already scores ${dasar}`,
        brier: "Brier score on the test data: the average squared gap between prediction and outcome, lower is better",
        f1: "F1 on the test data: a blend of precision and recall in picking out the climbers who succeed",
      },
      banding: { kepala: ["Algorithm", "Validation AUC", "Test AUC", "Test accuracy", "Test Brier"] },
      kelompok: { kepala: ["Group", "Test rows", "Actual", "Predicted", "AUC"], M: "Male", F: "Female" },
      oksigen: (aucPenuh, aucTanpa) =>
        `Oxygen matters a great deal. Without the two oxygen columns, test AUC falls from ${aucPenuh} to ${aucTanpa}. ` +
        "We have not checked whether that column was recorded before or after the outcome of the climb was known. If it was recorded afterward, part of the model's skill is data leakage.",
    },

    kalibrasi: {
      sumbuX: "Predicted odds (%)",
      sumbuY: "Actual outcome (%)",
      titik: (prediksi, nyata) => `Predicted ${prediksi}, actual ${nyata}`,
      uraian: (celah, rata, nyata) =>
        `The test predictions are split into ten groups. The closer a point sits to the dashed line, the more accurate the figure. The largest gap is ${celah} percentage points. ` +
        `The average prediction is ${rata}, while the actual rate is ${nyata}. The model was not recalibrated because its curve is already close to the diagonal.`,
    },

    geser: {
      latih: "training data",
      uji: "test data",
      legenda: "line: actual, hollow squares: predicted",
      titik: (tahun, prediksi, nyata) => `${tahun}: predicted ${prediksi}, actual ${nyata}`,
      baca: (tahun, berhasil, baris) => `${tahun}: ${berhasil} succeeded, ${baris} rows`,
      uraian: (latih, uji, lebih, total) =>
        `The success rate rises from ${latih} in the training data to ${uji} in the test data. ` +
        `The model is too optimistic in ${lebih} of the ${total} test years, so the yearly figures should be read with care.`,
      tabel: ["Test year", "Rows", "Actual", "Predicted", "Accuracy", "Brier"],
    },

    fitur: {
      oxygen_used: "Uses oxygen",
      oxygen_used_ekspedisi: "Expedition uses oxygen",
      height_metres: "Peak height",
      peak_age_years: "Years since first ascent",
      expedition_role: "Role in the expedition",
      age: "Climber's age",
      hired_staff_count: "Hired staff count",
      hired_staff_ratio: "Hired staff ratio",
      climbing_status: "Peak status",
      team_size: "Team size",
      citizenship: "Citizenship",
      season: "Season",
      sex: "Sex",
      hired: "Climber is hired staff",
      solo: "Solo climb",
      basecamp_month: "Basecamp month",
      is_eight_thousander: "8,000 m peak",
      first_ascent_country: "First ascent country",
      agency_prior_climbers: "Agency experience",
      agency_prior_success_rate: "Agency track record",
    },

    gunung: {
      basecamp: "Basecamp",
      foto: {
        ever: "Everest and Nuptse from Kala Patthar",
        lhot: "Everest, Lhotse, and Nuptse",
        amad: "Ama Dablam",
        choy: "Cho Oyu",
        maka: "Makalu and Chamlang",
        umum: "Pumori",
      },
      alt: (isi) => `${isi}, Himalaya`,
      altPengganti: (isi) => `${isi}, stand-in photo`,
      keterangan: (foto, puncak) => `Photo: ${foto}. ${puncak} does not have its own photo yet.`,
    },
  },
};

// Bahasa yang sedang dipakai. Berkas lain membaca TEKS, jadi cukup ganti isinya.
let TEKS = SEMUA.id;
