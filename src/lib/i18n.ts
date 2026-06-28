export type Language = "ru" | "kk" | "en";

const T: Record<string, Record<Language, string>> = {
  // ── Navigation (landing) ──────────────────────────────────────────────────
  nav_platform:        { ru: "ПЛАТФОРМА",           kk: "ПЛАТФОРМА",           en: "PLATFORM" },
  nav_reviewer:        { ru: "ПРОВЕРКА",             kk: "ТЕКСЕРУ",             en: "REVIEWER" },
  nav_analytics:       { ru: "АНАЛИТИКА",            kk: "АНАЛИТИКА",           en: "ANALYTICS" },
  nav_iiko:            { ru: "IIKO",                 kk: "IIKO",                en: "IIKO" },
  nav_demo:            { ru: "ДЕМО",                 kk: "ДЕМО",                en: "DEMO" },
  nav_sender:          { ru: "ОТПРАВИТЕЛЬ",          kk: "ЖІБЕРУШІ",            en: "SENDER" },
  nav_map:             { ru: "КАРТА",                kk: "КАРТА",               en: "MAP" },
  nav_audit:           { ru: "АУДИТ",                kk: "АУДИТ",               en: "AUDIT" },
  nav_live_demo:       { ru: "ЖИВОЕ ДЕМО",           kk: "ТІКЕЛЕЙ ДЕМО",        en: "LIVE DEMO" },
  nav_launch_demo:     { ru: "ЗАПУСТИТЬ ДЕМО",       kk: "ДЕМОНЫ ІСКЕ ҚОСУ",   en: "LAUNCH DEMO" },

  // ── Landing hero ──────────────────────────────────────────────────────────
  hero_h1:             { ru: "Каждое списание",      kk: "Әр списание",         en: "Every write-off" },
  hero_line:           { ru: "должно доказать себя.", kk: "дәлелденуі керек.",  en: "must prove itself." },
  hero_sub:            {
    ru: "PHYLAX выявляет фиктивные списания до iiko — фото-доказательство, дубли, ИИ-проверка, риск-скоринг.",
    kk: "PHYLAX фиктивті списандарды iiko-ға дейін анықтайды — фото, дубль тексеру, ЖИ, тәуекел бағасы.",
    en: "PHYLAX catches fake restaurant write-offs before they reach iiko — with camera-only proof, duplicate-photo detection, AI verification, risk scoring, and automatic write-off acts.",
  },
  launch_live_demo:    { ru: "ЗАПУСТИТЬ ДЕМО",       kk: "ДЕМОНЫ ІСКЕ ҚОСУ",   en: "LAUNCH LIVE DEMO" },
  open_risk_queue:     { ru: "ОЧЕРЕДЬ РИСКА",        kk: "ТӘУЕКЕЛ КЕЗЕГІ",     en: "OPEN RISK QUEUE" },

  // ── Demo moment / watch-panel ─────────────────────────────────────────────
  watch_panel_title:   {
    ru: "ПОДДЕЛАТЬ СПИСАНИЕ ФИЗИЧЕСКИ НЕВОЗМОЖНО",
    kk: "СПИСАНДЫ ФИЗИКАЛЫҚ ЖАЛҒАН ЖАСАУ МҮМКІН ЕМЕС",
    en: "WRITE-OFFS UNDER CONTROL",
  },
  open_risk_queue_btn: { ru: "ОТКРЫТЬ ОЧЕРЕДЬ РИСКА", kk: "РИСК КЕЗЕГІН АШУ", en: "OPEN RISK QUEUE" },

  // ── Final CTA ─────────────────────────────────────────────────────────────
  cta_heading:         {
    ru: "Готовы остановить фиктивные списания?",
    kk: "Жалған списандарды тоқтатуға дайынсыз ба?",
    en: "Ready to stop fake write-offs?",
  },
  cta_body:            {
    ru: "Дайте PHYLAX одну неделю — и следующий отчёт по стоимости продуктов покажет, где текли деньги, и что уже остановлено.",
    kk: "PHYLAX-қа бір апта беріңіз — келесі тамақ шығындары есебі ақша қайда кеткенін және не тоқтатылғанын көрсетеді.",
    en: "Give PHYLAX one week, and the next food cost report will show where money was leaking — and what has already been stopped.",
  },
  how_it_works:        { ru: "КАК ЭТО РАБОТАЕТ",   kk: "ҚАЛАЙ ЖҰМЫС ІСТЕЙДІ", en: "HOW IT WORKS" },

  // ── App role selection (/app) ─────────────────────────────────────────────
  choose_role:         { ru: "Выберите роль",        kk: "Рөл таңдаңыз",        en: "Choose your role" },
  demo_mode:           { ru: "ДЕМО РЕЖИМ",            kk: "ДЕМО РЕЖИМ",          en: "DEMO MODE" },
  role_cashier_cook:   { ru: "Кассир / Повар",       kk: "Кассир / Аспаз",      en: "Cashier / Cook" },
  role_submit_detail:  { ru: "Фото · Филиал · Отправить", kk: "Фото · Филиал · Жіберу", en: "Camera proof · Branch · Send" },
  role_control_dept:   { ru: "Контрольный отдел",    kk: "Бақылау бөлімі",      en: "Control Department" },
  role_high_risk:      { ru: "Высокий риск мошенничества", kk: "Жоғары алаяқтық тәуекелі", en: "High-risk fraud" },
  role_reject_detail:  { ru: "Очередь · ИИ-вердикт · Отклонить", kk: "Кезек · ЖИ шешімі · Қабылдамау", en: "Risk queue · AI verdict · Reject" },
  role_supervisor:     { ru: "Руководитель-администратор", kk: "Жетекші-әкімші",  en: "Supervisor-admin" },
  role_standard:       { ru: "Стандартные запросы",  kk: "Стандартты сұраулар", en: "Standard requests" },
  role_approve_detail: { ru: "Подтвердить · Отклонить · iiko", kk: "Растау · Қабылдамау · iiko", en: "Approve · Reject · iiko sync" },
  role_supply_dept:    { ru: "Отдел поставок",       kk: "Жабдықтау бөлімі",    en: "Supply Department" },
  role_supply_issues:  { ru: "Проблемы с качеством поставок", kk: "Жабдық сапасының мәселелері", en: "Supply-quality issues" },
  role_delivery_detail:{ ru: "Порча при доставке · Сигнал поставщику", kk: "Жеткізу зақымы · Жеткізуші сигналы", en: "Delivery damage · Supplier signal" },
  role_owner:          { ru: "Владелец / Администратор", kk: "Иесі / Әкімші",   en: "Owner / Admin" },
  role_analytics_sub:  { ru: "Аналитика и аудит",    kk: "Аналитика және аудит", en: "Analytics and audit" },
  role_branch_detail:  { ru: "Риск филиала · Убытки · Аудит", kk: "Филиал тәуекелі · Шығын · Аудит", en: "Branch risk · Losses · Audit" },

  // ── Sender page (/app/sender) ─────────────────────────────────────────────
  submit_writeoff:     { ru: "Отправить списание",   kk: "Списание жіберу",     en: "Submit write-off" },
  field_role:          { ru: "РОЛЬ",                 kk: "РӨЛ",                 en: "ROLE" },
  field_branch:        { ru: "ФИЛИАЛ",               kk: "ФИЛИАЛ",              en: "BRANCH" },
  field_product:       { ru: "ПРОДУКТ",              kk: "ӨНІМ",                en: "PRODUCT" },
  field_quantity:      { ru: "КОЛИЧЕСТВО",           kk: "САНЫ",                en: "QUANTITY" },
  field_unit:          { ru: "ЕШЕЛЕМ",               kk: "ӨЛШЕМ",               en: "UNIT" },
  field_reason:        { ru: "ПРИЧИНА",              kk: "СЕБЕП",               en: "REASON" },
  field_writeoff_type: { ru: "ТИП СПИСАНИЯ",         kk: "СПИСАНИЕ ТҮРІ",       en: "WRITE-OFF TYPE" },
  field_deduct_from:   { ru: "ВЫЧЕСТЬ У",            kk: "КІМНЕН ҰСТАУ",       en: "DEDUCT FROM" },
  field_comment:       { ru: "КОММЕНТАРИЙ (мин. 10)", kk: "КОММЕНТАРИЙ (мин. 10)", en: "COMMENT (min 10 chars)" },
  field_photo:         { ru: "ФОТО-ДОКАЗАТЕЛЬСТВО",  kk: "ФОТО-ДӘЛЕЛ",          en: "PHOTO PROOF" },
  take_photo:          { ru: "СДЕЛАТЬ ФОТО",         kk: "ФОТО ТҮСІРУ",         en: "TAKE PHOTO" },
  upload_test_photo:   { ru: "ЗАГРУЗИТЬ ФОТО",       kk: "ФОТО ЖҮКТЕУ",         en: "UPLOAD TEST PHOTO" },
  send_verification:   { ru: "ОТПРАВИТЬ НА ПРОВЕРКУ →", kk: "ТЕКСЕРУГЕ ЖІБЕРУ →", en: "SEND FOR VERIFICATION →" },
  locate_me:           { ru: "МОЁ МЕСТО",            kk: "ОРНЫМДЫ КӨР",         en: "USE NEAREST" },
  locating:            { ru: "ОПРЕДЕЛЕНИЕ...",        kk: "АНЫҚТАЛУДА...",        en: "LOCATING..." },
  view_in_queue:       { ru: "СМОТРЕТЬ В ОЧЕРЕДИ →", kk: "КЕЗЕКТЕ ҚАРАУ →",    en: "VIEW IN REVIEWER QUEUE →" },
  submit_another:      { ru: "ОТПРАВИТЬ ЕЩЁ",        kk: "ТАҒЫ ЖІБЕРУ",         en: "SUBMIT ANOTHER" },
  quick_presets:       { ru: "БЫСТРЫЕ ПРЕСЕТЫ",      kk: "ЖЫЛДАМ ПРЕСЕТТЕР",    en: "QUICK DEMO PRESETS" },

  // ── Reviewer page (/app/reviewer) ─────────────────────────────────────────
  risk_queue:          { ru: "ОЧЕРЕДЬ РИСКА",        kk: "ТӘУЕКЕЛ КЕЗЕГІ",      en: "RISK QUEUE" },
  approve:             { ru: "ПОДТВЕРДИТЬ",           kk: "РАСТАУ",              en: "APPROVE" },
  reject:              { ru: "ОТКЛОНИТЬ",             kk: "ҚАБЫЛДАМАУ",          en: "REJECT" },
  confirm_reject:      { ru: "ПОДТВЕРДИТЬ ОТКЛОНЕНИЕ", kk: "ҚАБЫЛДАМАУДЫ РАСТАУ", en: "CONFIRM REJECT" },
  request_new_photo:   { ru: "ЗАПРОСИТЬ НОВОЕ ФОТО", kk: "ЖАҢА ФОТО СҰРАУ",    en: "REQUEST NEW PHOTO" },
  select_from_queue:   { ru: "Выберите запрос из очереди", kk: "Кезектен сұрауды таңдаңыз", en: "Select a request from the queue" },

  // ── Dashboard (/app/dashboard) ────────────────────────────────────────────
  branch_oversight:    { ru: "Контроль филиалов",    kk: "Филиалдарды бақылау", en: "Branch oversight" },
  prevented_today_label: { ru: "ПРЕДОТВРАЩЕНО СЕГОДНЯ", kk: "БҮГІН САҚТАЛҒАН", en: "PREVENTED TODAY" },
  high_risk_req:       { ru: "ЗАПРОСЫ ВЫСОКОГО РИСКА", kk: "ЖОҒАРЫ ТӘУЕКЕЛДІ СҰРАУЛАР", en: "HIGH-RISK REQUESTS" },
  approval_rate:       { ru: "УРОВЕНЬ ОДОБРЕНИЯ",    kk: "МАҚҰЛДАУ ДЕҢГЕЙІ",   en: "APPROVAL RATE" },
  iiko_synced_acts:    { ru: "СИНХР. С IIKO",        kk: "IIKO СИНХР.",         en: "IIKO SYNCED ACTS" },
  open_branch_risk_map:{ ru: "Открыть карту риска",  kk: "Тәуекел картасын ашу", en: "Open Branch Risk Map" },

  // ── Map page (/app/map) ───────────────────────────────────────────────────
  branch_risk_map:     { ru: "Карта риска филиалов", kk: "Филиалдар риск картасы", en: "Branch Risk Map" },
  locate_me_full:      { ru: "МОЁ МЕСТОПОЛОЖЕНИЕ",  kk: "ОРНЫМДЫ КӨР",         en: "LOCATE ME" },
  nearest_branch:      { ru: "БЛИЖАЙШИЙ ФИЛИАЛ:",    kk: "ЕҢ ЖАҚЫН ФИЛИАЛ:",    en: "NEAREST BRANCH:" },

  // ── Audit page (/app/audit) ───────────────────────────────────────────────
  audit_history:       { ru: "История аудита",       kk: "Аудит тарихы",        en: "Audit history" },
  audit_log_label:     { ru: "НЕИЗМЕНЯЕМЫЙ ЖУРНАЛ АУДИТА", kk: "ӨЗГЕРМЕЙТІН АУДИТ ЖУРНАЛЫ", en: "IMMUTABLE AUDIT LOG" },

  // ── iiko page (/app/iiko) ─────────────────────────────────────────────────
  iiko_heading:        { ru: "Одно одобрение. Один акт списания.", kk: "Бір мақұлдау. Бір акт.", en: "One approval. One write-off act." },
  iiko_integration:    { ru: "ИНТЕГРАЦИЯ С IIKO",   kk: "IIKO ИНТЕГРАЦИЯСЫ",    en: "IIKO INTEGRATION" },

  // ── Demo page (/app/demo) ─────────────────────────────────────────────────
  run_scenario:        { ru: "ЗАПУСТИТЬ СЦЕНАРИЙ",   kk: "СЦЕНАРИЙДІ ІСКЕ ҚОС", en: "RUN FULL SCENARIO" },
  reset_demo:          { ru: "СБРОСИТЬ ДЕМО",        kk: "ДЕМОНЫ ҚАЛПЫНА КЕЛТІРУ", en: "RESET DEMO" },
};

export function t(lang: Language, key: string): string {
  const entry = T[key];
  if (!entry) return key;
  return entry[lang] ?? entry.en ?? key;
}
