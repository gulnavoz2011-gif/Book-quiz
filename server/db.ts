import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { generateSimplePdfDataUrl } from './pdfHelper';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

const TOKEN_SECRET = process.env.AUTH_SECRET || 'bookquiz_secure_jwt_secret_key_2026';

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  salt: string;
  role: 'admin' | 'user';
  createdAt: string;
}

export interface BookRecord {
  id: string;
  title: string;
  author: string;
  genre: string;
  description: string;
  coverImage: string;
  pdfUrl: string;
  fileSize: number;
  pagesCount: number;
  fullText: string;
  createdAt: string;
  uploadedBy?: string;
}

interface DatabaseSchema {
  users: UserRecord[];
  books: BookRecord[];
}

// Password hashing with PBKDF2 (industry standard)
export function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

export function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}

// Signed token creation (HMAC-SHA256)
export function generateToken(payload: { userId: string; email: string; role: string }): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const exp = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
  const body = Buffer.from(JSON.stringify({ ...payload, exp })).toString('base64url');
  const signature = crypto
    .createHmac('sha256', TOKEN_SECRET)
    .update(`${header}.${body}`)
    .digest('base64url');
  return `${header}.${body}.${signature}`;
}

export function verifyToken(token: string): { userId: string; email: string; role: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, body, signature] = parts;
    const expectedSig = crypto
      .createHmac('sha256', TOKEN_SECRET)
      .update(`${header}.${body}`)
      .digest('base64url');
    if (signature !== expectedSig) return null;
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf-8'));
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

// In-memory cache synced with disk
let dbMemory: DatabaseSchema | null = null;

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    } catch (e) {
      console.warn('Could not create data directory:', e);
    }
  }
}

function getInitialDatabase(): DatabaseSchema {
  const adminSalt = generateSalt();
  const userSalt = generateSalt();

  const defaultUsers: UserRecord[] = [
    {
      id: 'usr_admin',
      name: 'Mirzajonova Gulnavoz (Admin)',
      email: 'admin@bookquiz.uz',
      passwordHash: hashPassword('admin123', adminSalt),
      salt: adminSalt,
      role: 'admin',
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'usr_student',
      name: 'Azizbek Rahimov (Talaba)',
      email: 'talaba@bookquiz.uz',
      passwordHash: hashPassword('user123', userSalt),
      salt: userSalt,
      role: 'user',
      createdAt: '2026-01-10T00:00:00.000Z',
    },
  ];

  const defaultBooks: BookRecord[] = [
    {
      id: 'book_otkan_kunlar',
      title: "O'tkan kunlar",
      author: 'Abdulla Qodiriy',
      genre: 'Badiiy adabiyot',
      description: "O'zbek adabiyotidagi birinchi tarixiy roman. Otabek va Kumushbibining sof muhabbati, XIX asr Turkiston ijtimoiy-siyosiy muhiti va fojiali voqealar haqida yuksak mahorat bilan yozilgan durdona asar.",
      coverImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
      pdfUrl: generateSimplePdfDataUrl(
        "O'tkan kunlar",
        'Abdulla Qodiriy',
        [
          `BISMILLOHIR RAHMONIR RAHIYM\n\nModomiki, biz yangi davrga qadam qo'ydik, binafsina har bir yo'nalishda yangiliklar ketidan quvishimiz tabiiydir.\nShuningdek, adabiyot maydonida ham yangi romanlar, yangi asarlar vujudga kelishi darkordir.\n\n1264-hijriy yil, dalv oyining o'n yettinchisi, qishki quyosh botishga yuz tutgan bir payt...\nToshkentning mashhur beklaridan bo'lgan Yusufbek hojining o'g'li Otabek Marg'ilonga savdo ishlari bilan kelgan edi.\nMarg'ilonning gavjum va so'lim ko'chalarida bahor epkini sekin-asta ufurmoqda edi.`,
          `Otabek Marg'ilon xonadonlaridan birida mehmon bo'ldi.\nU Mirzakarim qutidorning xonadonida Kumushbibini tasodifan uchratdi.\nKumushbibining husni, hayosi va latofati yosh Otabek qalbida o'chmas muhabbat olovini yoqdi.\n\n"Bu qanday go'zallik, bu qanday nafosat?", deb xayol surardi Otabek.\nIkkala yoshning bir-biriga bo'lgan mayli tez orada mustahkam rishtalarga aylandi.`,
          `Biroq Toshkentdagi xonadon, Otabekning onasi O'zbek oyim Marg'ilonlik qizni kelin qilishni istamas edi.\nU Toshkentlik Zaynabni o'g'liga xotin qilib olib berish niyatida qat'iy turib oldi.\nBu esa Otabek va Kumush hayotida fojiali kunlarning ibtidosi bo'ldi.\n\nKitobdagi muhim saboq: Taassub va fitnalar qurboniga aylanmaslik, insoniy burch va sadoqatni har narsadan ustun qo'yishdir.`,
        ]
      ),
      fileSize: 312 * 1024 * 4,
      pagesCount: 312,
      fullText: `O'tkan kunlar - Abdulla Qodiriy. Tarixiy roman. Otabek, Kumushbibi, Zaynab, Homid, Yusufbek hoji, Hasanali. Otabek Marg'ilonga kelib Kumushbibiga uylanadi. Homidning fitnalari tufayli yoshlar ajralish xavfi ostida qoladilar. O'zbek oyim Toshkentda Zaynabni Otabekka xotin qilib olib beradi. Oxir-oqibat hasad oqibatida Kumush zaharlanadi va Otabek vatan himoyasidagi jangda qahramonlarcha halok bo'ladi. Asosiy g'oya: milliy birlik, xiyonat va fitnaning oqibatlari.`,
      createdAt: '2026-01-15T10:00:00.000Z',
    },
    {
      id: 'book_little_prince',
      title: 'The Little Prince (Kichik Shahzoda)',
      author: 'Antoine de Saint-Exupéry',
      genre: 'Falsafa & Psixologiya',
      description: "Sevgi, do'stlik, insoniylik va mas'uliyat haqida dunyodagi eng mashhur falsafiy ertak. 'Yurak bilan qaralmasa, haqiqat ko'zga ko'rinmaydi'.",
      coverImage: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=600&q=80',
      pdfUrl: generateSimplePdfDataUrl(
        'The Little Prince',
        'Antoine de Saint-Exupéry',
        [
          `Chapter 1: The Boa Constrictor and the Hat\nOnce when I was six years old I saw a magnificent picture in a book called True Stories from Nature about the primeval forest.\nIt was a picture of a boa constrictor in the act of swallowing an animal.\nI pondered deeply, then, over the adventures of the jungle. And after some work with a colored pencil I succeeded in making my first drawing.\nMy drawing was not a picture of a hat. It was a picture of a boa constrictor digesting an elephant.`,
          `Chapter 2: The Sahara Desert and the Little Prince\nI lived my life alone, without anyone that I could really talk to, until I had an accident with my plane in the Desert of Sahara.\nSomething was broken in my engine. The first night, then, I went to sleep on the sand, a thousand miles from any human habitation.\nAt sunrise, I was awakened by an odd little voice: "If you please — draw me a sheep!"\nI saw a most extraordinary small person examining me with great gravity.`,
          `Chapter 21: The Secret of the Fox\n"Goodbye," said the fox. "And now here is my secret, a very simple secret:\nIt is only with the heart that one can see rightly; what is essential is invisible to the eye."\n"What is essential is invisible to the eye," the little prince repeated, so that he would be sure to remember.\n"It is the time you have wasted for your rose that makes your rose so important."\n"You become responsible, forever, for what you have tamed. You are responsible for your rose."`,
        ]
      ),
      fileSize: 96 * 1024 * 4,
      pagesCount: 96,
      fullText: `The Little Prince by Antoine de Saint-Exupéry. Key themes: friendship, love, responsibility, seeing with the heart. The narrator crashes in the Sahara and meets the little prince from asteroid B-612. The prince talks about his rose, the dangerous baobab seeds, his visits to various planets (the King, the Conceited Man, the Tippler, the Businessman, the Lamplighter, the Geographer), and on Earth he meets the Fox who teaches him that what is essential is invisible to the eye.`,
      createdAt: '2026-01-20T12:00:00.000Z',
    },
    {
      id: 'book_atomic_habits',
      title: 'Atom Odatlar (Atomic Habits)',
      author: 'James Clear',
      genre: 'Biznes & Moliya',
      description: "Kichik o'zgarishlar — ulkan natijalar. Har kuni 1% yaxshilanish yiliga 37 barobar kuchayishga olib kelishini isbotlovchi dunyo bestselleri.",
      coverImage: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=600&q=80',
      pdfUrl: generateSimplePdfDataUrl(
        'Atom Odatlar',
        'James Clear',
        [
          `1-BOB: Kichik odatlarning kutilmagan kuchi\n\nNima uchun kichik odatlar katta o'zgarishlarga sabab bo'ladi?\nBiror narsani 1 foizga yaxshilash dastlab deyarli sezilmaydi, biroq uzoq muddatda u hayotiy ahamiyat kasb etadi.\nAgar siz bir yil davomida har kuni atigi 1 foiz yaxshiroq bo'lsangiz, yil oxirida 37 baravar yaxshiroq natijaga erishasiz!\nAksincha, har kuni 1 foiz yomonlashsangiz, natijangiz deyarli nolga tushadi.`,
          `2-BOB: Odatlar sizning shaxsingizni shakllantiradi\n\nOdatlarni o'zgartirish nima uchun qiyin?\nChunki ko'pchilik odatni o'zgartirishda 'Men nima qilmoqchiman?' (Natija) haqida o'ylaydi.\nAslida esa 'Men qanday inson bo'lmoqchiman?' (Shaxsiyat / Identity) degan savoldan boshlash lozim.\nHar bir bajargan amalingiz — siz bo'lmoqchi bo'lgan inson uchun berilgan ovozdir.`,
          `3-BOB: Odatlarning 4 ta asosiy qonuni\n\n1. Ko'rinadigan qiling (Make it obvious) — signal beruvchi muhit yarating.\n2. Jozibador qiling (Make it attractive) — miyada dopamin ajralishini rag'batlantiring.\n3. Oson qiling (Make it easy) — 2 daqiqalik qoidani qo'llang.\n4. Qoniqarli qiling (Make it satisfying) — darhol mukofot hissini bering.`,
        ]
      ),
      fileSize: 280 * 1024 * 4,
      pagesCount: 280,
      fullText: `Atomic Habits by James Clear. 1% improvements compound into 37x better results over one year. The 4 Laws of Behavior Change: 1. Make it obvious (Cue), 2. Make it attractive (Craving), 3. Make it easy (Response), 4. Make it satisfying (Reward). Identity-based habits vs outcome-based habits. The Two-Minute Rule: when you start a new habit, it should take less than two minutes to do. Environment design is stronger than willpower.`,
      createdAt: '2026-02-01T09:00:00.000Z',
    },
    {
      id: 'book_alchemist',
      title: 'Alximik (The Alchemist)',
      author: 'Paulo Coelho',
      genre: 'Badiiy adabiyot',
      description: "Andalusiyalik cho'pon Santyagoning o'z shaxsiy afsonasi (orzulari) ortidan Misr ehromlariga qilgan hayratlanarli va ruhiy sayohati.",
      coverImage: 'https://images.unsplash.com/photo-1476275466078-4007374efbbe?auto=format&fit=crop&w=600&q=80',
      pdfUrl: generateSimplePdfDataUrl(
        'Alximik',
        'Paulo Coelho',
        [
          `1-QISM: Cho'pon Santyagoning tushi\n\nYigitning ismi Santyago edi. Kun botishi arafasida u suruvini tashlandiq cherkovga haydab kirdi.\nUning tomi anchadan beri qulab tushgan, qurbongoh o'rnida esa ulkan anjir daraxti qad ko'targan edi.\nSantyago tushida bir bolakayni ko'rdi. Bola uni Misr ehromlariga boshlab borib, u yerda yashiringan xazina haqida gapirdi.\n\nSalem podshohi Melxisedek Santyagoga shunday dedi:\n"Qachonki sen biror narsani chin yurakdan istasang, butun Koinot sening orzuing ushalishi uchun harakat qiladi."`,
          `2-QISM: Saxro safari va Alximik bilan uchrashuv\n\nSantyago Afrikaga o'tib, billur sotuvchisining do'konida ishladi va sahro karvoniga qo'shildi.\nAl-Fayyum vohasida u sahro qizi Fotima bilan uchrashdi va unga oshiq bo'ldi.\nU yerda buyuk Alximik Santyagoga koinot tili va o'z yuragini tinglashni o'rgatdi:\n"Hech qachon yuragingdan qo'rqma, chunki azob chekishdan qo'rqish azobning o'zidan ham yomonroqdir."`,
          `3-QISM: Ehromlar va haqiqiy xazina\n\nSantyago nihoyat Misr ehromlariga yetib bordi va tushida ko'rgan joyini qaza boshladi.\nU yerda qaroqchilar uni kaltaklab, barcha boyligini tortib oldilar.\nQaroqchilar boshlig'i unga kulib dedi: "Men ham ikki yil oldin tush ko'rgan edim — Ispaniyadagi tashlandiq cherkovda, anjir daraxti tagida xazina bor emish. Lekin men bu tushga ishonib Ispaniyaga bormadim!"\nShunda Santyago xazinaning asl joyini anglab yetdi. Asl xazina uning o'z vatanida, boshlangan joyida edi!`,
        ]
      ),
      fileSize: 174 * 1024 * 4,
      pagesCount: 174,
      fullText: `The Alchemist by Paulo Coelho. Santiago, an Andalusian shepherd boy, dreams of treasure at the Egyptian pyramids. He meets Melchizedek (King of Salem), the crystal merchant in Tangier, the Englishman, and the Alchemist at the Al-Fayoum oasis. He falls in love with Fatima. The key philosophical concept: Personal Legend (Shaxsiy afsona). The Soul of the World. Omens and listening to one's heart. The treasure turns out to be buried back under the sycamore tree where his journey began.`,
      createdAt: '2026-02-10T14:30:00.000Z',
    },
    {
      id: 'book_clean_code',
      title: 'Toza Kod (Clean Code)',
      author: 'Robert C. Martin (Uncle Bob)',
      genre: 'IT & Dasturlash',
      description: "Dasturiy injiniring bo'yicha kult qo'llanma. Kodni o'qilishi oson, o'zgarishlarga moslashuvchan va xatolardan xoli yozish san'ati.",
      coverImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=600&q=80',
      pdfUrl: generateSimplePdfDataUrl(
        'Clean Code',
        'Robert C. Martin',
        [
          `Chapter 1: Clean Code\nWhat is clean code?\nBjarne Stroustrup, inventor of C++: "I like my code to be elegant and efficient. The logic should be straightforward to make it hard for bugs to hide."\nGrady Booch: "Clean code is simple and direct. Clean code never obscures the designer's intent."\n\nThe Boy Scout Rule: Leave the campground cleaner than you found it.\nIf all of us checked in our code a little cleaner than when we checked it out, the code simply could not rot.`,
          `Chapter 2: Meaningful Names\nNames are everywhere in software. We name our variables, our functions, our arguments, classes, and packages.\n1. Use intention-revealing names: If a name requires a comment, then the name does not reveal its intent.\n2. Avoid disinformation: Don't refer to a grouping of accounts as an accountList unless it's actually a List.\n3. Make meaningful distinctions: ProductInfo and ProductData are indistinguishable noise words.\n4. Use pronounceable names and searchable names.`,
          `Chapter 3: Functions\nThe first rule of functions is that they should be small.\nThe second rule of functions is that they should be smaller than that!\nFunctions should do one thing. They should do it well. They should do it only.\nOne level of abstraction per function. Function arguments should ideally be 0 (niladic), 1 (monadic), or at most 2 (dyadic).`,
        ]
      ),
      fileSize: 464 * 1024 * 4,
      pagesCount: 464,
      fullText: `Clean Code: A Handbook of Agile Software Craftsmanship by Robert C. Martin (Uncle Bob). Key principles: The Boy Scout Rule, Meaningful Names, Functions should do one thing and be small, SOLID principles (Single Responsibility, Open-Closed, Liskov Substitution, Interface Segregation, Dependency Inversion), Comments should not make up for bad code, Unit testing and Test-Driven Development (TDD).`,
      createdAt: '2026-02-15T08:15:00.000Z',
    },
    {
      id: 'book_steve_jobs',
      title: 'Stiv Jobs (Steve Jobs)',
      author: 'Walter Isaacson',
      genre: 'Tarix & Biografiya',
      description: "Apple asoschisi Stiv Jobsning texnologiya, san'at va dizaynni birlashtirgan hayoti, uning murosasiz mukammallikka intilishi haqida rasmiy biografiya.",
      coverImage: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=600&q=80',
      pdfUrl: generateSimplePdfDataUrl(
        'Stiv Jobs',
        'Walter Isaacson',
        [
          `1-BOB: Bolalik va Garajdagi ixtiro\n\nStiv Jobs 1955-yil San-Frantsiskoda tug'ildi. Uni Pol va Klara Jobs asrab oldilar.\nPol Jobs mexanik bo'lib, o'g'liga sifatli hunarmandchilik sirlarini o'rgatdi: "Shkafning orqa tomoni ko'rinmasa ham, uni chiroyli taxtadan yasash kerak."\n1976-yilda 21 yoshli Stiv Jobs va Stiv Voznyak ota-onasining garajida Apple kompaniyasiga asos soldilar.\nVoznyak texnik daholikni, Jobs esa mahsulotni odamlarga yetkazish va soddalashtirish san'atini o'z zimmasiga oldi.`,
          `2-BOB: Haqiqatni buzish maydoni (Reality Distortion Field)\n\nJobsning hamkasblari uni 'Haqiqatni buzish maydoni'ga ega deb ta'riflashardi.\nU imkonsiz bo'lib tuyulgan narsalarni ham boshqalarga ishontira olar va xodimlarni o'z imkoniyatlaridan 10 barobar yuqori natijaga erishishga majbur qilardi.\nMacintosh kompyuteri grafik interfeys va sichqoncha bilan birga chiqqan birinchi ommaviy kompyuter bo'ldi.\nJobsning shiori: "Murosasiz soddalik — eng yuksak murakkablikdir."`,
          `3-BOB: NeXT, Pixar va Apple-ning qayta tug'ilishi\n\n1985-yilda Apple-dan chetlatilgan Jobs NeXT va Pixar kompaniyalarini yaratdi.\n1997-yilda Apple inqirozga uchraganda u qaytib keldi va "Think Different" kampaniyasini boshladi.\nKeyinchalik iPod, iPhone va iPad orqali musiqa, telefon va kompyuter sanoatini butunlay o'zgartirib yubordi.`,
        ]
      ),
      fileSize: 520 * 1024 * 4,
      pagesCount: 520,
      fullText: `Steve Jobs by Walter Isaacson. Biography of Steve Jobs, co-founder of Apple, NeXT, and Pixar. Focus on design excellence, the intersection of humanities and sciences, the Reality Distortion Field, the creation of Apple I, Apple II, Macintosh, iMac, iPod, iTunes, iPhone, iPad. Passion for perfection and simplicity. Standalone achievements in personal computing, animated movies, music, phones, and digital publishing.`,
      createdAt: '2026-02-20T16:45:00.000Z',
    },
  ];

  return { users: defaultUsers, books: defaultBooks };
}

export function loadDatabase(): DatabaseSchema {
  if (dbMemory) return dbMemory;
  ensureDataDir();

  if (fs.existsSync(DB_FILE)) {
    try {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      dbMemory = JSON.parse(data);
      return dbMemory!;
    } catch (e) {
      console.error('Error reading db.json, reinitializing:', e);
    }
  }

  dbMemory = getInitialDatabase();
  saveDatabase(dbMemory);
  return dbMemory;
}

export function saveDatabase(data: DatabaseSchema): void {
  dbMemory = data;
  ensureDataDir();
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to write db.json:', e);
  }
}

// User Operations
export function findUserByEmail(email: string): UserRecord | undefined {
  const db = loadDatabase();
  return db.users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
}

export function findUserById(id: string): UserRecord | undefined {
  const db = loadDatabase();
  return db.users.find((u) => u.id === id);
}

export function registerUser(name: string, email: string, password: string, role: 'admin' | 'user' = 'user'): UserRecord {
  const db = loadDatabase();
  const existing = findUserByEmail(email);
  if (existing) {
    throw new Error('Email allaqachon ro\'yxatdan o\'tgan.');
  }

  const salt = generateSalt();
  const passwordHash = hashPassword(password, salt);
  const newUser: UserRecord = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: name.trim(),
    email: email.toLowerCase().trim(),
    passwordHash,
    salt,
    role,
    createdAt: new Date().toISOString(),
  };

  db.users.push(newUser);
  saveDatabase(db);
  return newUser;
}

// Books Operations
export interface BookFilterParams {
  search?: string;
  genre?: string;
  author?: string;
  page?: number;
  limit?: number;
}

export function queryBooks(params: BookFilterParams): {
  books: BookRecord[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
} {
  const db = loadDatabase();
  let results = [...db.books];

  // Filter by search query (title, author, or description)
  if (params.search && params.search.trim()) {
    const q = params.search.toLowerCase().trim();
    results = results.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.description.toLowerCase().includes(q) ||
        b.genre.toLowerCase().includes(q)
    );
  }

  // Filter by genre
  if (params.genre && params.genre.trim() && params.genre !== 'all' && params.genre !== 'Barchasi') {
    const g = params.genre.toLowerCase().trim();
    results = results.filter((b) => b.genre.toLowerCase() === g);
  }

  // Filter by author
  if (params.author && params.author.trim()) {
    const a = params.author.toLowerCase().trim();
    results = results.filter((b) => b.author.toLowerCase().includes(a));
  }

  // Sort by createdAt descending (newest first)
  results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const total = results.length;
  const page = Math.max(1, Number(params.page) || 1);
  const limit = Math.max(1, Math.min(50, Number(params.limit) || 6));
  const totalPages = Math.ceil(total / limit) || 1;
  const startIndex = (page - 1) * limit;
  const paginated = results.slice(startIndex, startIndex + limit);

  return {
    books: paginated,
    total,
    page,
    totalPages,
    limit,
  };
}

export function getBookById(id: string): BookRecord | undefined {
  const db = loadDatabase();
  return db.books.find((b) => b.id === id);
}

export function createBook(data: Omit<BookRecord, 'id' | 'createdAt'>): BookRecord {
  const db = loadDatabase();
  const newBook: BookRecord = {
    ...data,
    id: `book_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString(),
  };

  db.books.unshift(newBook);
  saveDatabase(db);
  return newBook;
}

export function updateBook(id: string, updates: Partial<Omit<BookRecord, 'id' | 'createdAt'>>): BookRecord {
  const db = loadDatabase();
  const index = db.books.findIndex((b) => b.id === id);
  if (index === -1) {
    throw new Error('Kitob topilmadi.');
  }

  db.books[index] = {
    ...db.books[index],
    ...updates,
  };

  saveDatabase(db);
  return db.books[index];
}

export function deleteBook(id: string): boolean {
  const db = loadDatabase();
  const initialLen = db.books.length;
  db.books = db.books.filter((b) => b.id !== id);
  if (db.books.length !== initialLen) {
    saveDatabase(db);
    return true;
  }
  return false;
}

export function getDistinctGenres(): string[] {
  const db = loadDatabase();
  const genres = new Set<string>();
  db.books.forEach((b) => {
    if (b.genre) genres.add(b.genre.trim());
  });
  return Array.from(genres);
}
