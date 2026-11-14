'use strict';
// ================= Bank kata, peribahasa, dan pelajaran =================

const WORD_DATA = {
  id: `saja salah kalah jaga lada dada kakak halal galak adalah jasa gala lagak sadap
abu ada adu air aku api apa asa ayo bak ban bau bel bis bus cat cek dan dek dia doa dua era esa gas gol gua hak hal ibu ide ini itu jam jas jet jin jus kas kau kok kol kue lap las lem mau mie nol oli pak pas pil pin pos rak ras rel rem rok sah sel sop sup tak tas tes tim tol ton tua uap ubi uji wol zat
abad adik agar ajar alam alat alis anak apel arah arti asam asap atap atas awal awan awas ayah ayam bagi bahu baju bara baru batu bawa beda bela beli beri biru bisa bola buah buat budi buka buku bulu bumi cari cium cuci dadu dahi daki dari dasi data daun desa dini dulu duri ekor elok emas enak foto gaji gali gaya gema gigi gula guru hari hati haus hias ikan ilmu jadi jago jari jauh jeda jika jual juga kaca kain kaki kami kamu kaos kata kayu keju kera kode koin kopi kota kuat kuda kuku laba labu lagi lagu lari laut lele lima lobi luas lucu lupa madu main maju mana mata mega meja muda muka nada nama nasi niat obat oven pagi pena peta pipi pita puas ragu raja rapi rasa ratu rela roda roti rusa sama sapi sari satu sepi siap sisi soal sore suka susu tahu tali tamu tari tebu tema tepi tiga tiup toga toko topi uang ubin ufuk ular ulat umur unta usia yoga zona
akhir angin angka antar badai badan bahan bakso balon bambu bantu barat batik bebas bekal belum benar benda besar betul bibir bijak botol bulan bumbu bunga bunyi busur candi cepat cerah cinta dalam damai danau darat dasar dekat denda depan detik dunia elang empat gajah gelap gelas gitar hadir halus harga harum hemat hewan hidup hijau hitam hujan hutan indah ingat irama jaket jalan jalur jamur jarum jatuh jawab jeruk jujur kabar kapal karya kasur kecil kelas kemah kenal kerja kilat kipas kodok kolam kotak kunci kursi lampu lebah lebar lemon libur lidah lilin lomba lurus makan malam malas mandi manis masak merah minum mobil mulai murah musik nanas nyata ombak orang pagar pahit paket pakai panas pasar papan pecah pedas pelan penuh perak perut petir pikir pilih pintu pohon pulau radio rajin ramah ramai rindu rumah rumus sabar sabun salju sawah sayap sayur sedih segar sehat sejuk semut senja siang sinar suara sudut surat taman tanah tanya tawar tebal teman tenda terus tidur tiket tikus timur tinta tomat tugas tulis turun udara ujian utara wajah waktu warga warna yakin zaman zebra
anggur bangun banyak berani burung cahaya celana cerita coklat datang dengar dingin dompet durian gambar gelang guntur gunung gunting hadiah hampir jempol jernih jaring kamera kampus kancil kantor kartun kemeja kertas kompor kucing kuning lambat langit lapang laptop lemari lengan lereng lompat mainan mangga mantel masjid melati menang minggu nyanyi padang pantai pantun payung pemain pensil perahu petang petani pindah piring pulang pulpen rakyat rambut rantai rantau renang rintik rumput sambal sambut sampah sandal sarung sayang sebuah segera sejati senang senyum sepatu sepeda simpan sinyal sungai suling tabung tambah tampan tangan tangga tempat tenaga tenang tengah terang tetapi tinggi tombol topeng tujuan tukang tumbuh ukuran unggul warung wisata wortel
anggrek angkasa bahagia bandara bekerja belajar bendera berbagi berlari bermain bersatu bintang cokelat gembira gerakan gerbang gerimis gitaris halaman harapan harimau jangkar jendela jerapah kambing kancing kelinci kendali keramik kerupuk ketupat kilatan kreatif lampion listrik makanan mangkuk membaca mendaki mendung mengapa mentari menulis merdeka merpati minuman nelayan pameran pelajar pelangi pelatih pendaki penulis pesawat pesisir pikiran pramuka pustaka rahasia rendang sahabat saudara sayuran sejarah sekolah selamat selimut semangka semesta sendiri seragam suasana tanaman telepon terbang terjadi tertawa terumbu tradisi tulisan ulangan upacara warisan
berhasil berlayar bermimpi berpikir bersinar gemerlap gemilang hamparan istimewa jembatan kacamata kegiatan kelompok keluarga kemudian kepiting kerajaan komputer lapangan matahari melompat membantu mengalir mengejar mengetik menyanyi pahlawan pemimpin perayaan perlahan rambutan rembulan samudera sekarang semangat semboyan sepasang serigala seruling sukacita terampil tercepat terlihat terompet tetangga tumbuhan unggulan wartawan
berangkat bernyanyi bijaksana cakrawala cemerlang gelombang kecepatan kesehatan kesulitan kompetisi lingkaran melangkah menyambar nusantara pelabuhan penerbang perhatian permainan petualang rangkaian sederhana sejahtera selamanya sepanjang tantangan teknologi
berkembang bersahabat dinosaurus halilintar keberanian kemenangan kesempatan ketelitian ketinggian menggambar pendidikan pengalaman penjelajah perjalanan perlombaan pertanyaan senantiasa
kebahagiaan kebersamaan kegembiraan kepercayaan ketangkasan pemandangan pengetahuan pertunjukan petualangan keterampilan perpustakaan persahabatan khatulistiwa`,

  en: `act add age air all and ant any arm art ask bag bat bed bee big bit box boy bug bus buy cap car cat cow cup cut day dig dog dot dry ear eat egg end eye fan far fig fit fix fly fog fox fun gap gem gift hat hen hop hot ice ink jam jar jet job joy key kid kit lab lap leg lid lip log map mix mud net new nut oak oil old orb owl pan pen pet pie pig pin pop pot ray red rib row rug run sea sky sun tea ten tip toe top toy tub van web wet win yak yes zip zoo
able also atom aunt baby back bake ball band bank barn bell belt bird blue boat bold bone book boot bowl cake calm camp card cave chef chip city clay coat code coin cold cook cool corn crab crow cube dart dawn deer desk dice dish door dove down drum duck dune dust easy echo edge exit face fact farm fast fern fire fish flag foam fork frog fuel game gate gear girl glow goal goat gold golf good grid grow hair half hand harp hawk heat helm herb hero hill hive home hood hope horn idea iron jade jazz joke jump kind king kite kiwi lake lamp land lava leaf lime lion list loop luck mail mask meal milk mint moon moss nest note oven pace page palm park path pear pine plan play plum poem pond quiz rain ring road rock roof root rope rose ruby sail salt sand seed ship shoe silk sing snow soap sock song soup star step stew surf swim tail team tent tide time tree trip tuna vase vest view wave wind wing wolf wood yarn yard zero zone
actor adult alarm album alert alive alone amber angel angle apple arena arrow audio award badge baker basic beach beard begin bench berry black blade blank blast blaze blend bloom board bonus boost brain brave bread brick brief bring broad brook brown brush buddy build burst cabin cable camel candy canoe cargo catch cedar chain chair chalk charm chart chase check cheer chess chest chief child chill choir claim class clean clear click cliff climb clock cloud coach coast cobra cocoa comet comic coral count craft crane crash cream creek crisp crowd crown curve cycle daily dance delta denim diary dizzy dough dozen draft drama dream dress drift drink drive eager eagle early earth easel elbow ember empty enjoy enter equal event exact extra fable fairy fancy feast field final first flame flash float flock floor flour flute focus foggy forge found frame fresh frost fruit funny giant glass globe glory glove grace grain grand grape graph grass great green group guard guess guide habit happy heart heavy hello honey horse hotel human igloo image index inner ivory jelly jewel juice label laser laugh layer learn lemon level light lilac limit linen lucky lunar lunch magic major mango maple marsh match medal melon metal minor model month motor mouse music noble noise north novel ocean olive onion orbit order paint panda paper party pasta patch peace peach pearl piano pilot pixel pizza plant plate polar power prism quest quick quiet quilt radar radio rapid raven ready relax river robot round royal salad scale scarf scout seven shelf shell shine skate skill sleep small smart smile snake solar solid sound space spark speed spoon squad stage stamp steam stone storm story sugar sunny super swift table tiger toast today token tooth torch tower track trail train tribe trust tulip uncle unity upper urban valid vivid voice wagon water whale wheel world young zebra
action animal artist asleep autumn banana basket breeze bright bubble butter button camera canvas carbon carpet carrot castle cheese cherry circle coffee cookie copper corner cotton dinner doctor donkey double dragon desert design detail energy engine family farmer finger flower forest friend frozen galaxy garden gentle ginger guitar hammer harbor helmet hidden island jacket jungle junior kettle kitten ladder laptop lizard magnet market meadow melody memory meteor middle mirror monkey motion mystery narrow nature needle office orange orchid oxygen paddle palace parade parrot pencil people pepper pickle pillow pirate planet pocket potato puzzle rabbit random rescue ribbon riddle ripple rocket saddle salmon school secret shadow shield silver simple singer sketch smooth soccer spider spirit splash spring square stable street strong studio summer sunset target temple tennis thirty ticket timber tomato travel turtle twelve valley velvet violet violin wallet window winter wizard wonder yellow yogurt
balance capture chicken compass concert cottage crystal curious dolphin explore feather harvest hundred imagine journey kingdom lantern library machine mermaid monster morning musical natural network october orchard pancake panther passion penguin perfect picture popcorn pottery printer pyramid rainbow science seaweed shelter society special station student thunder tonight tornado tractor treasure trumpet unicorn uniform village volcano weather whisper
alphabet backpack birthday blizzard calendar champion children computer daughter dinosaur elephant exercise favorite festival football fountain giraffe hospital keyboard language mountain notebook painting pressure princess question sandwich shoulder skeleton snowball sunlight sunshine together tomorrow triangle umbrella universe vacation
adventure beautiful butterfly chocolate classroom colorful dangerous discovery excellent fantastic fireworks happiness important invisible lightning marathon orchestra pineapple playground satellite snowflake spaceship strawberry submarine sunflower telescope waterfall wonderful
basketball friendship microphone rainforest volleyball watermelon government incredible restaurant technology adventurous`,
};

const PROVERBS = {
  id: [
    'ada gula ada semut',
    'air tenang menghanyutkan',
    'hemat pangkal kaya',
    'nasi sudah menjadi bubur',
    'bagai pinang dibelah dua',
    'tong kosong nyaring bunyinya',
    'air beriak tanda tak dalam',
    'lain padang lain belalang',
    'tak kenal maka tak sayang',
    'malu bertanya sesat di jalan',
    'habis manis sepah dibuang',
    'besar pasak daripada tiang',
    'seperti katak dalam tempurung',
    'bagai pungguk merindukan bulan',
    'tak ada gading yang tak retak',
    'buah jatuh tak jauh dari pohonnya',
    'gajah mati meninggalkan gading',
    'rajin pangkal pandai hemat pangkal kaya',
    'bersatu kita teguh bercerai kita runtuh',
    'ilmu padi makin berisi makin merunduk',
    'ringan sama dijinjing berat sama dipikul',
    'duduk sama rendah berdiri sama tinggi',
    'karena nila setitik rusak susu sebelanga',
    'di mana bumi dipijak di situ langit dijunjung',
  ],
  en: [
    'knowledge is power',
    'practice makes perfect',
    'better late than never',
    'great minds think alike',
    'fortune favors the bold',
    'slow and steady wins the race',
    'actions speak louder than words',
    'every cloud has a silver lining',
    'the early bird catches the worm',
    'the pen is mightier than the sword',
    'a picture is worth a thousand words',
    'rome was not built in a day',
    'where there is a will there is a way',
    'do not judge a book by its cover',
  ],
};

const PROPER = {
  id: 'Jakarta Bandung Surabaya Medan Makassar Semarang Palembang Denpasar Yogyakarta Malang Bogor Padang Pontianak Manado Ambon Jayapura Kupang Mataram Banjarmasin Balikpapan Samarinda Pekanbaru Jambi Bengkulu Lampung Serang Cirebon Solo Kediri Madiun Aceh Sumatra Jawa Bali Lombok Kalimantan Sulawesi Papua Maluku Flores Sumba Bromo Rinjani Toba Borobudur Prambanan Senin Selasa Rabu Kamis Jumat Sabtu Minggu Januari Februari Maret April Mei Juni Juli Agustus September Oktober November Desember Indonesia Nusantara Garuda Merdeka',
  en: 'London Paris Tokyo Sydney Cairo Berlin Madrid Rome Toronto Chicago Boston Seattle Dublin Oslo Vienna Prague Lisbon Athens Monday Tuesday Wednesday Thursday Friday Saturday Sunday January February March April May June July August September October November December Earth Mars Jupiter Saturn Venus Mercury Neptune Pluto Nile Everest Sahara Pacific Atlantic Arctic Africa Asia Europe America Australia',
};

const HOME = 'asdfghjkl';
const LESSONS = [
  { id: 'tengah', name: 'Baris Tengah', keys: HOME, desc: 'A S D F G H J K L, posisi awal jari' },
  { id: 'atas', name: 'Baris Atas', keys: HOME + 'qwertyuiop', desc: 'Q sampai P, ditambah baris tengah' },
  { id: 'bawah', name: 'Baris Bawah', keys: HOME + 'zxcvbnm', desc: 'Z sampai M, ditambah baris tengah' },
  { id: 'semua', name: 'Semua Huruf', keys: 'abcdefghijklmnopqrstuvwxyz', desc: 'Kata biasa, huruf a sampai z' },
  { id: 'besar', name: 'Huruf Besar', caps: true, desc: 'Nama kota, hari, dan bulan. Latihan Shift' },
  { id: 'angka', name: 'Angka', digits: true, desc: 'Deretan angka 0 sampai 9' },
  { id: 'lemah', name: 'Huruf Lemahku', weak: true, desc: 'Kata yang penuh huruf yang sering meleset' },
];

const Words = {
  lists: {},    // lang -> semua kata
  recent: [],
  custom: null, // daftar kata khusus pelajaran yang sedang dimainkan
  lesson: null,

  build() {
    for (const lang in WORD_DATA) {
      const seen = new Set();
      this.lists[lang] = WORD_DATA[lang].split(/\s+/).filter((w) => {
        if (!w || seen.has(w) || !/^[a-z]+$/.test(w)) return false;
        seen.add(w);
        return true;
      });
    }
  },

  // Siapkan sumber kata sesuai mode/pelajaran sebelum permainan mulai.
  setup(lesson, lang) {
    this.lesson = lesson || null;
    this.lang = lang;
    this.recent.length = 0;
    this.custom = null;
    this.letters = 'abcdefghijklmnopqrstuvwxyz';
    if (!lesson) return;
    const all = this.lists[lang];
    if (lesson.keys) {
      const ok = new Set(lesson.keys);
      this.letters = lesson.keys;
      const real = all.filter((w) => [...w].every((c) => ok.has(c)));
      const list = real.slice();
      // kalau kata aslinya sedikit, tambah suku kata latihan
      const need = Math.max(0, 70 - real.length);
      for (let i = 0; i < need; i++) list.push(this.drill(lesson.keys));
      this.custom = list;
    } else if (lesson.caps) {
      this.custom = PROPER[lang].split(' ');
      this.letters = 'abcdefghijklmnopqrstuvwxyz';
    } else if (lesson.digits) {
      this.custom = 'digits';
      this.letters = '0123456789';
    } else if (lesson.weak) {
      const weak = Records.weakKeys(6).map((x) => x.c);
      const set = new Set(weak);
      this.weakSet = weak;
      const scored = all
        .map((w) => ({ w, s: [...w].filter((c) => set.has(c)).length / Math.sqrt(w.length) }))
        .filter((x) => x.s > 0)
        .sort((a, b) => b.s - a.s);
      this.custom = scored.slice(0, 160).map((x) => x.w);
    }
  },

  // suku kata buatan dari huruf yang tersedia: "fala", "jaks", dst.
  drill(keys) {
    const vowels = [...keys].filter((c) => 'aiueo'.includes(c));
    const cons = [...keys].filter((c) => !'aiueo'.includes(c));
    if (!vowels.length || Math.random() < 0.25) {
      const a = pick([...keys]), b = pick([...keys]);
      return Math.random() < 0.5 ? a + b + a + b : a + a + b + b;
    }
    let w = '';
    const syl = randi(2, 3);
    for (let i = 0; i < syl; i++) w += pick(cons.length ? cons : vowels) + pick(vowels);
    if (Math.random() < 0.3 && cons.length) w += pick(cons);
    return w;
  },

  digits(min, max) {
    const len = randi(Math.max(2, min), Math.max(2, Math.min(max, 6)));
    let s = String(randi(1, 9));
    while (s.length < len) s += randi(0, 9);
    return s;
  },

  // Ambil satu kata dengan panjang min..max, hindari huruf awal yang sedang dipakai musuh lain.
  pick(min, max, avoid) {
    let pool;
    if (this.custom === 'digits') {
      for (let i = 0; i < 20; i++) {
        const d = this.digits(min, max);
        if (!avoid || !avoid.has(d[0])) return d;
      }
      return this.digits(min, max);
    }
    if (this.custom) {
      pool = this.custom.filter((w) => w.length >= min - 1 && w.length <= max + 2);
      if (pool.length < 8) pool = this.custom;
    } else {
      const all = this.lists[this.lang || 'id'];
      pool = all.filter((w) => w.length >= min && w.length <= max);
      if (pool.length < 8) pool = all.filter((w) => w.length >= min - 1 && w.length <= max + 1);
    }
    let w = null;
    for (let i = 0; i < 40 && !w; i++) {
      const c = pick(pool);
      const first = c[0].toLowerCase();
      if (i < 30 && avoid && avoid.has(first)) continue;
      if (i < 20 && this.recent.includes(c)) continue;
      w = c;
    }
    w = w || pick(pool);
    this.recent.push(w);
    if (this.recent.length > 40) this.recent.shift();
    return w;
  },

  // satu karakter untuk peluru
  char(avoid) {
    const src = this.letters;
    for (let i = 0; i < 20; i++) {
      const c = src[Math.floor(Math.random() * src.length)];
      if (!avoid || !avoid.has(c)) return c;
    }
    return src[0];
  },

  proverb(index) {
    const list = PROVERBS[this.lang || 'id'];
    // makin jauh gelombangnya, makin panjang peribahasanya
    const sorted = list.slice().sort((a, b) => a.length - b.length);
    const span = Math.max(3, Math.floor(sorted.length / 3));
    const start = Math.min(sorted.length - span, index * Math.floor(span / 2));
    return sorted[start + Math.floor(Math.random() * span)];
  },
};

Words.build();
