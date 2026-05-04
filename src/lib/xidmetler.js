// Bütün şirkətlərin xidmət siyahısı - mərkəzləşdirilmiş
export const SIRKET_XIDMETLER = {
  "GMS (Ümumi)": [
    "Ev təmizliyi",
    "Ofis təmizliyi",
    "Pəncərə təmizliyi",
    "Xalça yuma",
    "Divan yuma",
    "Tikintidən sonra",
    "Dərin təmizlik",
    "Mətbəx təmizliyi",
    "Digər",
  ],
  "Mərmərçi": [
    "Səthin parlaqlığının və estetik görünüşünün bərpası",
    "Səth bərpası",
    "Periodik stone care (planlı baxım)",
    "Mərmər səthlərin təmizlənməsi",
    "Betonun yuyulması və cilalanması",
    "Mərmərin vurulması (quraşdırma)",
    "Ara dolğusu",
    "Epoksid tətbiqi",
  ],
  "Service Plus": [
    "Təmir sonrası təmizlik",
    "Ümumi / dərin təmizlik",
    "Kimyəvi təmizlik",
    "Aylıq (daimi) təmizlik xidməti",
  ],
  "Ganbaroğlu": [
    "Alpinist xidməti",
    "Tullantıların çıxarılması / daşınması",
    "Daimi işçi təminatı",
    "Kimyəvi vasitələrin satışı",
    "Təmizlik avadanlıqlarının satışı",
    "Təmir / tikinti / dizayn",
    "Marketinq xidməti",
    "IT və proqramlaşdırma xidmətləri",
  ],
};

export const SIRKETLER = Object.keys(SIRKET_XIDMETLER);

// Bütün xidmətlərin düz siyahısı (legacy uyğunluq üçün)
export const BUTUN_XIDMETLER = Object.values(SIRKET_XIDMETLER).flat();