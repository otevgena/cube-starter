// src/components/blocks/About.jsx
// Блок «О нас» (clean-rebuild): Обзор → УЗНАТЬ БОЛЬШЕ / О НАС (гифка-винт на «С») →
// картинка → крупные абзацы → «Команда» → «Бюрократия» → «Кто отвечает за → Результат».
import React from "react";

const TITLE = { fontSize: "clamp(48px, 13.5vw, 137px)" };

function Arrow() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" className="block shrink-0">
      <path d="M4 12h14" stroke="#222" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 6l6 6-6 6" fill="none" stroke="#222" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* подчёркивание как у «Генеральный директор»: серая полоска + выезжающая тёмная */
function Underline() {
  return (
    <>
      <span className="absolute inset-x-0 bottom-0 h-0.5 bg-neutral-300" />
      <span className="absolute bottom-0 left-0 h-0.5 w-0 bg-ink transition-[width] duration-300 group-hover:w-full" />
    </>
  );
}

/* «Узнать больше» — кнопка-раскрывашка */
function LearnMore({ onClick }) {
  return (
    <button type="button" onClick={onClick} className="group mt-12 inline-flex items-center gap-1.5 text-left">
      <Arrow />
      <span className="relative pb-1 text-base font-semibold leading-6">
        Узнать больше
        <Underline />
      </span>
    </button>
  );
}

/* раскрывающийся блок */
function Expandable({ open, children }) {
  return (
    <div
      className="overflow-hidden transition-[max-height,opacity] duration-300 ease-out"
      style={{ maxHeight: open ? 1000 : 0, opacity: open ? 1 : 0 }}
    >
      {children}
    </div>
  );
}

export default function About() {
  const [expanded, setExpanded] = React.useState(false);
  const [expandedProc, setExpandedProc] = React.useState(false);

  // Анимация винта (screw.gif) на «С» в «О НАС» — перезапуск при скролле/ховере
  const learnMoreRef = React.useRef(null);
  const screwWrapRef = React.useRef(null);

  const replayScrew = React.useCallback(() => {
    const img = screwWrapRef.current?.querySelector("img");
    if (!img) return;
    const src = img.src;
    img.src = "";
    void img.offsetWidth; // reflow
    img.src = src;
  }, []);

  React.useEffect(() => {
    const target = learnMoreRef.current;
    if (!target) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && replayScrew()),
      { threshold: 0.6 }
    );
    io.observe(target);
    return () => io.disconnect();
  }, [replayScrew]);

  const handleProcTextClick = (e) => {
    if (e.target.closest && e.target.closest("a, button")) return;
    setExpandedProc((v) => !v);
  };

  return (
    <section className="bg-page pt-14 font-tight text-ink lg:pt-[88px]" aria-label="О нас">
      {/* Обзор */}
      <div className="text-center text-sm font-light leading-7">Обзор</div>

      {/* УЗНАТЬ БОЛЬШЕ / О НАС (отступ от метки «Обзор» — фирменный, держим одинаковым) */}
      <div ref={learnMoreRef} onMouseEnter={replayScrew} className="mt-[26px] text-center">
        <h2 className="font-semibold uppercase leading-none" style={TITLE}>УЗНАТЬ БОЛЬШЕ</h2>
        <h2 className="font-semibold uppercase leading-none" style={TITLE}>
          О НА
          <span className="relative inline-block">
            С
            <span
              ref={screwWrapRef}
              aria-hidden="true"
              className="pointer-events-none absolute block h-[40px] w-[40px] select-none sm:h-[60px] sm:w-[60px]"
              style={{ left: "calc(50% + 33px)", top: "calc(100% - 74px)", transform: "translate(-50%, -8%)" }}
            >
              <img src="/about/screw.gif" alt="" width="60" height="60" className="block h-[40px] w-[40px] sm:h-[60px] sm:w-[60px]" loading="lazy" decoding="async" />
            </span>
          </span>
        </h2>
        <p className="mt-3.5 text-[18px] font-light leading-7 sm:mt-4 sm:text-[21px]">Наши проекты, опыт, решения.</p>
      </div>

      {/* Крупные абзацы (картинку убрали — текст идёт сразу) */}
      <div className="mx-4 mt-16 max-w-[1100px] text-left text-[24px] leading-[32px] sm:mx-12 sm:text-[32px] sm:leading-[42px] lg:ml-20 lg:mr-0 lg:mt-24 lg:text-[40px] lg:leading-[52px]">
        <p className="font-semibold">
          Признание и опыт, отмечающие вклад нашей команды в развитие инженерных систем.
        </p>
        <p className="mt-10 font-light">
          Пространство профессионалов, где инженеры и проектировщики делятся опытом, знаниями и
          техническими решениями, чтобы создавать надёжные и эффективные объекты.
        </p>
        <p className="mt-10 font-light">
          Наши ценности:{" "}
          <span className="whitespace-nowrap">«<span className="font-semibold">Всегда задаём вопросы</span>»,</span>{" "}
          <span className="whitespace-nowrap">«<span className="font-semibold">Всегда развиваемся</span>».</span>
        </p>
      </div>

      {/* Команда */}
      <div className="mt-12 grid grid-cols-1 items-start gap-y-10 lg:mt-[172px] lg:grid-cols-2">
        {/* текст */}
        <div className="mx-4 max-w-[760px] text-left text-dark lg:ml-20 lg:mr-0 lg:mt-[221px]">
          <div className="text-sm font-light leading-7">Команда</div>
          <h2 className="mt-3.5 text-[30px] font-semibold leading-[38px] sm:text-[36px] sm:leading-[44px] lg:text-[43px] lg:leading-[52px]">Почему</h2>
          <h2 className="text-[30px] font-semibold leading-[38px] sm:text-[36px] sm:leading-[44px] lg:text-[43px] lg:leading-[52px]">
            компания «<span className="font-semibold">КУБ</span>»?
          </h2>
          <p className="mt-8 max-w-[760px] text-pretty text-[18px] font-light leading-[26px] lg:mt-12 lg:text-[21px] lg:leading-7">
            В компании «<span className="font-semibold">КУБ</span>» мы собрали команду специалистов с большим
            опытом работы в проектировании и монтаже инженерных систем. Каждый проект проходит детальную
            проработку и контроль качества, чтобы результат был надёжным, безопасным и соответствовал
            современным требованиям и нормативам.
          </p>
          <LearnMore onClick={() => setExpanded((v) => !v)} />
          <Expandable open={expanded}>
            <p className="mt-6 text-pretty text-[18px] font-light leading-[26px] lg:text-[21px] lg:leading-7">
              Мы берём на себя полный цикл работ — от обследования объекта и разработки проектной документации
              до поставки оборудования, монтажа, пусконаладки и сдачи в эксплуатацию. Работа ведётся в
              соответствии с действующими нормами и стандартами (СП, ГОСТ, ПУЭ, ПТЭЭП). За каждым проектом
              закрепляется ответственный инженер, ведём прозрачный календарный план и смету, регулярно
              предоставляем отчёты. Гарантируем соблюдение сроков и бюджета, предоставляем гарантию и сервисное
              обслуживание. Подбираем решения под задачи и бюджет заказчика, уделяя внимание
              энергоэффективности и удобству эксплуатации.
            </p>
          </Expandable>
        </div>

        {/* картинка */}
        <div className="mx-4 lg:ml-0 lg:mr-20">
          <img
            src="/about/about2.png"
            alt="Команда КУБ"
            className="block h-auto w-full max-w-[760px] rounded-[10px] transition-[filter] duration-200 hover:brightness-[0.82]"
            loading="lazy"
          />
        </div>
      </div>

      {/* Бюрократия */}
      <div className="mt-12 grid grid-cols-1 items-start gap-y-10 lg:mt-[220px] lg:grid-cols-[auto_1fr] lg:gap-x-[94px]">
        {/* картинка */}
        <div className="order-2 mx-4 lg:order-none lg:ml-20 lg:mr-0">
          <img
            src="/about/about3.png"
            alt="Как делаем «под ключ» без лишней бюрократии"
            className="block h-auto w-full max-w-[693px] rounded-[10px] object-cover transition-[filter] duration-200 hover:brightness-[0.82] lg:h-[1039px] lg:w-[693px]"
            loading="lazy"
            decoding="async"
          />
        </div>

        {/* текст (клик по области раскрывает) */}
        <div
          onClick={handleProcTextClick}
          title="Нажмите, чтобы раскрыть подробности"
          className="order-1 mx-4 max-w-[760px] cursor-pointer text-left text-dark lg:order-none lg:ml-0 lg:mr-20 lg:mt-[221px]"
        >
          <div className="text-sm font-light leading-7">Бюрократия</div>
          <h2 className="mt-3.5 text-[30px] font-semibold leading-[38px] sm:text-[36px] sm:leading-[44px] lg:text-[43px] lg:leading-[52px]">
            Как делаем «под ключ» без лишней бюрократии?
          </h2>
          <p className="mt-8 max-w-[760px] text-pretty text-[18px] font-light leading-[26px] lg:mt-12 lg:text-[21px] lg:leading-7">
            Только нужные бумаги и понятные шаги. Площадка и офис работают синхронно: статус и бюджет видны в
            один клик. Сначала показываем «как есть», потом идём по согласованному плану. Итог — готовая система
            и простая эксплуатация.
          </p>
          <LearnMore onClick={() => setExpandedProc((v) => !v)} />
          <Expandable open={expandedProc}>
            <div className="mt-6 space-y-1.5 text-[18px] font-light leading-[26px] lg:text-[21px] lg:leading-7">
              {[
                "Покажем на схемах, что где стоит и сколько нужно.",
                "Дадим план по датам: когда и что делаем, что привозим.",
                "Сделаем фото скрытых зон до закрытия — чтобы всё было видно.",
                "Передадим отчёты о проверках: работает и безопасно.",
                "Оставим короткую инструкцию по обслуживанию: что делать и как часто.",
              ].map((t, i) => (
                <p key={i} className="text-pretty pl-[1.15em] -indent-[1.15em]">— {t}</p>
              ))}
            </div>
          </Expandable>
        </div>

        {/* Кто отвечает за → Результат */}
        <div className="order-3 col-span-full -mt-2 px-4 text-center text-base font-light lg:order-none lg:mt-[108px] lg:px-20">
          Кто отвечает за{" "}
          <span className="inline-flex items-center gap-1.5 align-middle">
            <Arrow />
            <a href="#result" onClick={(e) => e.preventDefault()} className="group relative pb-1 font-semibold">
              Результат
              <Underline />
            </a>
          </span>
        </div>
      </div>
    </section>
  );
}
