// src/data/search-index.ts
// Локальный поисковый индекс по сайту CUBE (без backend и БД).
// Поиск понимает русские названия, аббревиатуры, тех. сокращения и бытовые запросы.

export type SearchItem = {
  title: string;
  category: string;
  marker?: string;
  href: string;
  aliases?: string[];
  keywords?: string[];
};

export const SEARCH_INDEX: SearchItem[] = [
  // ===== Категории услуг =====
  { title: "Электромонтаж", category: "Услуги", marker: "ЭМ", href: "/services/electrical",
    keywords: ["электромонтаж", "электрика", "электрик", "проводка", "электричество"] },
  { title: "Слаботочные системы", category: "Услуги", marker: "СС", href: "/services/lowcurrent",
    keywords: ["слаботочка", "слаботочные системы", "слаботочные сети"] },
  { title: "Климат-системы", category: "Услуги", marker: "ОВиК", href: "/services/ventilation",
    keywords: ["климат", "вентиляция", "кондиционирование", "отопление", "овик"] },
  { title: "Проектирование", category: "Услуги", marker: "ПИР", href: "/services/design",
    keywords: ["проект", "проектирование", "документация", "проектные работы"] },
  { title: "Общестрой", category: "Услуги", marker: "СМР", href: "/services/construction",
    keywords: ["строительство", "общестрой", "ремонт", "отделка", "строительные работы"] },

  // ===== Электромонтаж =====
  { title: "Подключение объектов к электросетям", category: "Электромонтаж", marker: "ТУ", href: "/services/electrical/power-connection",
    aliases: ["ТУ"], keywords: ["технические условия", "подключение", "техприсоединение", "присоединение к сетям", "подключить объект"] },
  { title: "Увеличение мощности и модернизация сетей", category: "Электромонтаж", marker: "кВт", href: "/services/electrical/power-upgrade",
    aliases: ["кВт"], keywords: ["увеличение мощности", "модернизация", "дополнительная мощность", "квт", "больше мощности"] },
  { title: "Внутренние электромонтажные работы", category: "Электромонтаж", marker: "0,4 кВ", href: "/services/electrical/indoor",
    keywords: ["внутренние работы", "проводка", "розетки", "кабель", "электромонтаж внутри", "электрика в помещении"] },
  { title: "Наружные электросети и уличное освещение", category: "Электромонтаж", marker: "10 кВ", href: "/services/electrical/outdoor-networks",
    keywords: ["наружные сети", "уличное освещение", "кабельная линия", "опоры", "освещение улиц", "наружка"] },
  { title: "Монтаж электрощитов и ВРУ", category: "Электромонтаж", marker: "ВРУ", href: "/services/electrical/switchgear-vru",
    aliases: ["ВРУ", "ГРЩ", "ЩР"], keywords: ["щит", "электрощит", "распределительный щит", "вводно-распределительное устройство", "щиток", "сборка щитов"] },
  { title: "Системы заземления и молниезащиты", category: "Электромонтаж", marker: "Rз", href: "/services/electrical/earthing-lightning",
    aliases: ["Rз"], keywords: ["заземление", "молниезащита", "контур заземления", "молниеотвод", "грозозащита"] },
  { title: "Автоматизация и учёт электроэнергии", category: "Электромонтаж", marker: "АСКУЭ", href: "/services/electrical/energy-metering-automation",
    aliases: ["АСКУЭ"], keywords: ["учет электроэнергии", "счетчик", "автоматизация учета", "приборы учета", "учет электричества"] },
  { title: "Резервное электроснабжение", category: "Электромонтаж", marker: "ДГУ", href: "/services/electrical/backup-power",
    aliases: ["ДГУ", "ИБП", "АВР"], keywords: ["генератор", "дизель-генератор", "резервное питание", "источник бесперебойного питания", "бесперебойник", "автоввод резерва"] },

  // ===== Слаботочные системы =====
  { title: "СКС и структурированные кабельные сети", category: "Слаботочные системы", marker: "СКС", href: "/services/lowcurrent/sks",
    aliases: ["СКС"], keywords: ["витая пара", "rj45", "интернет кабель", "структурированные кабельные сети", "кабельные сети", "патч-панель", "локальная сеть", "проводка интернета", "сетевой кабель"] },
  { title: "Видеонаблюдение (CCTV)", category: "Слаботочные системы", marker: "CCTV", href: "/services/lowcurrent/cctv",
    aliases: ["CCTV"], keywords: ["камеры", "ip камеры", "видеонаблюдение", "камера", "наблюдение", "видеокамеры"] },
  { title: "Охранно-пожарная сигнализация", category: "Слаботочные системы", marker: "ОПС", href: "/services/lowcurrent/ops",
    aliases: ["ОПС"], keywords: ["пожарка", "охранка", "сигнализация", "пожарная сигнализация", "охранная сигнализация", "датчики дыма", "пожарная безопасность"] },
  { title: "Системы контроля и управления доступом", category: "Слаботочные системы", marker: "СКУД", href: "/services/lowcurrent/skud",
    aliases: ["СКУД"], keywords: ["контроль доступа", "турникет", "электрозамок", "пропуск", "доступ", "карты доступа"] },
  { title: "Домофония и интерком", category: "Слаботочные системы", marker: "IP", href: "/services/lowcurrent/intercom",
    keywords: ["домофон", "интерком", "переговорное устройство", "вызывная панель", "домофония"] },
  { title: "Серверные, кроссовые и шкафы", category: "Слаботочные системы", marker: "19\"", href: "/services/lowcurrent/server-cross",
    keywords: ["серверная", "кроссовая", "телекоммуникационный шкаф", "стойка", "монтажный шкаф", "серверный шкаф", "19 дюймов"] },
  { title: "ЛВС и активное сетевое оборудование", category: "Слаботочные системы", marker: "LAN", href: "/services/lowcurrent/lan-network",
    aliases: ["LAN", "ЛВС"], keywords: ["сеть", "коммутатор", "роутер", "локальная сеть", "switch", "сетевое оборудование", "wifi", "вайфай"] },
  { title: "Системы оповещения и звука", category: "Слаботочные системы", marker: "СОУЭ", href: "/services/lowcurrent/public-address",
    aliases: ["СОУЭ"], keywords: ["оповещение", "озвучивание", "громкая связь", "трансляция", "звук", "эвакуация"] },

  // ===== Климат-системы =====
  { title: "Проектирование и монтаж вентиляции", category: "Климат-системы", marker: "ОВ", href: "/services/ventilation/ventilation-design-install",
    keywords: ["вентиляция", "приточка", "вытяжка", "воздухообмен", "приточно-вытяжная"] },
  { title: "Системы кондиционирования (VRF/VRV)", category: "Климат-системы", marker: "VRF", href: "/services/ventilation/conditioning-vrf-vrv",
    aliases: ["VRF", "VRV"], keywords: ["кондиционер", "кондиционирование", "сплит", "мульти-сплит", "охлаждение воздуха", "кондей"] },
  { title: "Чиллер-фанкойл системы", category: "Климат-системы", marker: "FCU", href: "/services/ventilation/chiller-fancoil",
    aliases: ["FCU"], keywords: ["чиллер", "фанкойл", "холодоснабжение", "chiller"] },
  { title: "Системы отопления и теплоснабжения", category: "Климат-системы", marker: "ИТП", href: "/services/ventilation/heating-heat-supply",
    aliases: ["ИТП"], keywords: ["отопление", "теплоснабжение", "тепловой пункт", "батареи", "радиаторы", "теплый пол"] },
  { title: "Автоматика ОВиК", category: "Климат-системы", marker: "BMS", href: "/services/ventilation/hvac-automation",
    aliases: ["BMS"], keywords: ["автоматика", "диспетчеризация", "управление климатом", "автоматизация овик"] },
  { title: "Паспортизация и балансировка систем", category: "Климат-системы", marker: "ПНР", href: "/services/ventilation/passport-balancing",
    aliases: ["ПНР"], keywords: ["паспортизация", "балансировка", "наладка вентиляции", "пусконаладка"] },
  { title: "Воздуховоды, шумоглушение, КИПиА", category: "Климат-системы", marker: "КИП", href: "/services/ventilation/ducts-silencers-kipia",
    aliases: ["КИП", "КИПиА"], keywords: ["воздуховоды", "шумоглушитель", "кип", "приборы"] },
  { title: "Сервис и регламентное обслуживание", category: "Климат-системы", marker: "ТО", href: "/services/ventilation/service-maintenance",
    aliases: ["ТО"], keywords: ["обслуживание", "сервис", "техобслуживание", "регламент", "чистка"] },

  // ===== Проектирование =====
  { title: "Проект электроснабжения (ЭОМ)", category: "Проектирование", marker: "ЭОМ", href: "/services/design/power-eom",
    aliases: ["ЭОМ"], keywords: ["проект электроснабжения", "электроснабжение проект", "раздел эом", "электрика проект"] },
  { title: "Проект ОВ и ВК", category: "Проектирование", marker: "ОВ/ВК", href: "/services/design/hvac-vk",
    aliases: ["ОВ", "ВК", "ОВ/ВК", "ОВиВК"], keywords: ["отопление вентиляция проект", "водопровод канализация", "проект ов", "проект вк", "раздел ов", "раздел вк"] },
  { title: "Проект СС (слаботочные системы)", category: "Проектирование", marker: "СС", href: "/services/design/lowcurrent-ss",
    aliases: ["СС"], keywords: ["проект слаботочки", "раздел сс", "слаботочный проект"] },
  { title: "АСУ ТП и разделы автоматики", category: "Проектирование", marker: "АСУ", href: "/services/design/automation-asutp",
    aliases: ["АСУ", "АСУ ТП", "АСУТП"], keywords: ["автоматизация", "асу тп", "автоматика проект", "scada"] },
  { title: "Молниезащита и заземление", category: "Проектирование", marker: "МЗ", href: "/services/design/lightning-earthing",
    aliases: ["МЗ"], keywords: ["молниезащита проект", "заземление проект"] },
  { title: "Сметная документация", category: "Проектирование", marker: "СД", href: "/services/design/estimate-documentation",
    aliases: ["СД"], keywords: ["смета", "сметная документация", "расчет стоимости", "сметы"] },
  { title: "Авторский надзор", category: "Проектирование", marker: "АН", href: "/services/design/author-supervision",
    aliases: ["АН"], keywords: ["авторский надзор", "надзор за строительством"] },
  { title: "Согласования в сетевых организациях", category: "Проектирование", marker: "СО", href: "/services/design/network-approvals",
    keywords: ["согласования", "техусловия", "сетевые организации", "получение ту"] },

  // ===== Общестрой =====
  { title: "Общестроительные и отделочные работы", category: "Общестрой", marker: "СМР", href: "/services/construction/general-finishing",
    aliases: ["СМР"], keywords: ["отделка", "строительные работы", "ремонт", "общестрой"] },
  { title: "Монолитные и бетонные работы", category: "Общестрой", marker: "ЖБ", href: "/services/construction/monolith-concrete",
    aliases: ["ЖБ"], keywords: ["монолит", "бетон", "железобетон", "заливка", "опалубка"] },
  { title: "Фундамент и земляные работы", category: "Общестрой", marker: "ЗР", href: "/services/construction/foundation-earthworks",
    aliases: ["ЗР"], keywords: ["фундамент", "земляные работы", "котлован", "сваи"] },
  { title: "Кровля и фасад", category: "Общестрой", marker: "КФ", href: "/services/construction/roof-facade",
    keywords: ["кровля", "крыша", "фасад", "облицовка", "вентфасад"] },
  { title: "Внутренние перегородки и проёмы", category: "Общестрой", marker: "ГКЛ", href: "/services/construction/partitions-openings",
    aliases: ["ГКЛ"], keywords: ["перегородки", "гипсокартон", "проемы", "стены"] },
  { title: "Усиление конструкций", category: "Общестрой", marker: "УК", href: "/services/construction/structural-strengthening",
    keywords: ["усиление", "усиление конструкций", "реконструкция", "укрепление"] },
  { title: "Генподряд и технадзор", category: "Общестрой", marker: "ГП", href: "/services/construction/general-contracting-supervision",
    aliases: ["ГП"], keywords: ["генподряд", "технадзор", "строительный контроль", "генеральный подрядчик"] },
  { title: "Пуско-наладка инженерных систем", category: "Общестрой", marker: "ПНР", href: "/services/construction/commissioning",
    aliases: ["ПНР"], keywords: ["пусконаладка", "пуско-наладка", "наладка", "ввод в эксплуатацию", "пнр"] },

  // ===== Разделы сайта =====
  { title: "О нас", category: "Раздел", href: "/#about", keywords: ["о компании", "о нас", "команда", "про нас", "о куб"] },
  { title: "Проекты", category: "Раздел", href: "/#projects", keywords: ["проекты", "наши работы", "портфолио", "объекты", "реализованные проекты"] },
  { title: "Контакты", category: "Раздел", href: "/#contact", keywords: ["контакты", "связаться", "написать", "заявка", "телефон", "почта", "оставить заявку"] },
  { title: "Отзывы", category: "Раздел", href: "/#reviews", keywords: ["отзывы", "рекомендации", "что говорят"] },
  { title: "Вакансии", category: "Раздел", href: "/pro", keywords: ["работа", "вакансии", "ищу работу", "карьера", "трудоустройство"] },
];

/* ===== Нормализация ===== */
const norm = (s: string) => (s || "").toLowerCase().replace(/ё/g, "е").replace(/\s+/g, " ").trim();
// для сравнения дополнительно убираем кавычки/точки/дефисы/скобки/слэши
const strip = (s: string) =>
  norm(s).replace(/["'`.,()/\\-]/g, "").replace(/\s+/g, " ").trim();

/* ===== Ранжирование ===== */
function scoreItem(item: SearchItem, q: string): number {
  let s = 0;
  const up = (v: number) => { if (v > s) s = v; };

  const title = strip(item.title);
  const cat = strip(item.category);
  const marker = strip(item.marker || "");
  const aliases = (item.aliases || []).map(strip);
  const keywords = (item.keywords || []).map(strip);

  if (marker && marker === q) up(100);          // точное совпадение маркера
  if (aliases.includes(q)) up(95);              // точное совпадение alias
  if (title === q) up(92);                      // точное совпадение названия
  if (keywords.includes(q)) up(74);             // точное совпадение keyword
  if (marker && marker.startsWith(q)) up(70);
  if (title.startsWith(q)) up(66);              // начало названия
  if (aliases.some((a) => a.startsWith(q))) up(58);
  if (title.includes(q)) up(46);               // внутри названия
  if (aliases.some((a) => a.includes(q))) up(42);
  if (keywords.some((k) => k.startsWith(q))) up(38);
  if (keywords.some((k) => k.includes(q))) up(30);
  if (cat.startsWith(q)) up(22);
  if (cat.includes(q)) up(16);                 // совпадение категории

  return s;
}

/* ===== Поиск ===== */
export function search(query: string, limit = 8): SearchItem[] {
  const q = strip(query);
  if (q.length < 2) return [];
  return SEARCH_INDEX
    .map((item) => ({ item, score: scoreItem(item, q) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.item.title.length - b.item.title.length)
    .slice(0, limit)
    .map((x) => x.item);
}
