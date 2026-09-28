"""Pipeline praproses yang diserahkan ke bagian pemodelan.

Bagian ini sengaja berbentuk objek scikit-learn, bukan tabel yang sudah jadi.
Alasannya: pengisian nilai kosong dan penskalaan harus dipelajari dari data
latih saja. Kalau dikerjakan lebih dulu di seluruh tabel, rata-rata dan median
data uji ikut bocor ke data latih.

Pemakaian di sisi pemodelan:

    from praproses.pipeline import buat_praproses, FITUR
    from sklearn.pipeline import Pipeline

    pipa = Pipeline([
        ("praproses", buat_praproses()),
        ("model", RandomForestClassifier()),
    ])
    pipa.fit(latih[FITUR], latih["success"])
"""

from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

# Fitur numerik dan biner. Kolom boolean ikut di sini karena scikit-learn
# memperlakukannya sebagai 0 dan 1.
NUMERIK = [
    "age",
    "team_size",
    "hired_staff_count",
    "hired_staff_ratio",
    "basecamp_month",
    "peak_age_years",
    "height_metres",
    "is_eight_thousander",
    "agency_prior_climbers",
    "agency_prior_success_rate",
    "hired",
    "solo",
    "oxygen_used",
    "oxygen_used_ekspedisi",
]

KATEGORIK = [
    "season",
    "sex",
    "expedition_role",
    "citizenship",
    "climbing_status",
    "first_ascent_country",
]

FITUR = NUMERIK + KATEGORIK

# Kategori yang muncul lebih jarang dari ambang ini digabung jadi satu
# kelompok "jarang". Tanpa ini, expedition_role sendiri menghasilkan 524
# kolom, dan 509 di antaranya muncul kurang dari 50 kali.
AMBANG_KATEGORI_JARANG = 50


def buat_praproses(ambang_jarang: int = AMBANG_KATEGORI_JARANG) -> ColumnTransformer:
    """Rangkai pengisian nilai kosong, penskalaan, dan encoding jadi satu objek.

    Jalur numerik memakai median, bukan rata-rata, karena beberapa kolom
    miring jauh ke satu sisi. `agency_prior_climbers` misalnya bergerak dari
    0 sampai 5.547.

    Penskalaan tetap dipasang meski model pohon tidak membutuhkannya. Kelompok
    kami membandingkan tiga algoritma, dan regresi logistik butuh skala yang
    seragam. Untuk model pohon penskalaan tidak mengubah hasil.

    `handle_unknown="infrequent_if_exist"` membuat kategori yang tidak pernah
    muncul saat pelatihan tidak menggagalkan prediksi. Itu penting karena
    aplikasi nanti menerima masukan bebas dari pengguna.
    """
    jalur_numerik = Pipeline(
        [
            ("isi", SimpleImputer(strategy="median")),
            ("skala", StandardScaler()),
        ]
    )

    jalur_kategorik = Pipeline(
        [
            ("isi", SimpleImputer(strategy="most_frequent")),
            (
                "encode",
                OneHotEncoder(
                    handle_unknown="infrequent_if_exist",
                    min_frequency=ambang_jarang,
                    sparse_output=False,
                ),
            ),
        ]
    )

    return ColumnTransformer(
        [
            ("numerik", jalur_numerik, NUMERIK),
            ("kategorik", jalur_kategorik, KATEGORIK),
        ],
        remainder="drop",
        verbose_feature_names_out=False,
    )
