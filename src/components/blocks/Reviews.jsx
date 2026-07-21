// src/components/blocks/Reviews.jsx
// Блок «Отзывы» (clean-rebuild): шапка + 2 карточки-скана.
// «Читать отзыв» открывает модалку с PDF; снизу закреплена плашка с данными клиента.
import React from "react";
import { createPortal } from "react-dom";
import FitScale from "@/components/common/FitScale.jsx";

const TITLE = { fontSize: "clamp(48px, 13.5vw, 137px)" };

const REVIEWS = [
  {
    bg: "/reviews/review1.jpg",
    pdf: "/reviews/review1.pdf",
    title: ["Опыт сотрудничества глазами", "наших заказчиков"],
    name: "Кулютников Д. С.",
    company: "Везерфорд",
    date: "16.07.2026",
    city: "Ноябрьск",
  },
  {
    bg: "/reviews/review2.jpg",
    pdf: "/reviews/review2.pdf",
    title: ["Что говорят партнёры", "о результатах работы"],
    name: "",
    company: "",
    date: "",
    city: "",
    // второго отзыва пока нет — кнопка «Читать отзыв» здесь пустышка (ничего не делает)
    disabled: true,
  },
];

/* модалка отзыва: PDF + закреплённая снизу плашка с данными */
function ReviewModal({ review, onClose }) {
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);

    // блокируем скролл, НЕ пряча фон и не теряя позицию
    const root = document.documentElement;
    const scrollY = window.scrollY;
    const prevOverflow = root.style.overflow;
    root.style.overflow = "hidden";
    document.body.classList.add("review-open"); // анимационно прячем нижний док

    return () => {
      window.removeEventListener("keydown", onKey);
      root.style.overflow = prevOverflow;
      document.body.classList.remove("review-open");
      if (window.scrollY !== scrollY) window.scrollTo(0, scrollY);
    };
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-[100] grid place-items-center p-2 font-tight sm:p-4">
      <div className="absolute inset-0 bg-black/55" onClick={onClose} />

      <div className="relative flex h-[94vh] w-full max-w-[920px] animate-svcfade flex-col overflow-hidden rounded-2xl bg-[#ededed] shadow-2xl sm:h-[90vh]">
        {/* крестик для мобилки — сверху справа поверх документа */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Закрыть"
          className="absolute right-3 top-3 z-[102] grid h-10 w-10 place-items-center rounded-full bg-[#111]/85 text-white shadow-lg sm:hidden"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        {/* PDF как документ в паспарту */}
        <div className="min-h-0 flex-1 px-3 pt-3 sm:px-5 sm:pt-5">
          <div className="h-full overflow-hidden rounded-lg bg-white">
            <iframe
              src={`${review.pdf}#toolbar=0&navpanes=0&view=FitH`}
              title="Отзыв клиента"
              className="h-full w-full border-0 bg-white"
            />
          </div>
        </div>

        {/* плашка с данными — пары «подпись/значение» (2 колонки на мобилке, 4 на десктопе) */}
        <div className="bg-[#ededed] px-4 pb-4 pt-3 sm:px-5 sm:pb-5 sm:pt-4">
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
            {[
              ["Имя клиента", review.name],
              ["Компания", review.company],
              ["Дата", review.date],
              ["Город", review.city],
            ].map(([label, val]) => (
              <div key={label} className="min-w-0">
                <div className="text-sm font-light text-neutral-500">{label}</div>
                <div className="mt-1 truncate text-[16px] font-normal text-dark">{val || "—"}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* крестик десктоп — внизу справа, на месте дока */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Закрыть"
        title="Закрыть"
        className="fixed right-6 z-[101] hidden h-[60px] w-[60px] place-items-center rounded-xl bg-[#111] text-white shadow-xl transition-transform hover:-translate-y-px sm:grid"
        style={{ bottom: "calc(var(--dock-bottom, 21px) + (var(--dock-h, 72px) - var(--dock-left-tile, 60px)) / 2)" }}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
    </div>,
    document.body
  );
}

function ReviewCard({ review, onRead }) {
  return (
    <div className="relative h-[555px] w-[710px] overflow-hidden rounded-[10px] bg-black text-white">
      <img
        src={review.bg}
        alt="Скан отзыва"
        className="absolute inset-0 h-full w-full object-cover brightness-[0.30]"
        loading="lazy"
        decoding="async"
      />
      <div aria-hidden="true" className="absolute inset-0 bg-black/[0.38]" />

      {/* верхний контент */}
      <div className="absolute inset-x-[62px] top-[62px] text-left">
        <div className="text-sm font-light leading-7 opacity-95">Отзыв клиента</div>
        <div className="mt-3.5 text-[43px] font-semibold leading-[50px]">
          {review.title.map((line, i) => (
            <React.Fragment key={i}>
              {line}
              {i !== review.title.length - 1 && <br />}
            </React.Fragment>
          ))}
        </div>
        <div className="mt-9">
          <button
            type="button"
            onClick={review.disabled ? undefined : onRead}
            className="inline-flex h-[72px] w-[179px] items-center justify-center rounded-[10px] text-lg text-white ring-[0.5px] ring-inset ring-white transition-colors hover:bg-white hover:text-black"
          >
            Читать отзыв
          </button>
        </div>
      </div>

      {/* нижняя строка справа */}
      <div className="absolute inset-x-[62px] bottom-8 text-right text-sm font-light leading-7">
        Хотите оставить свой?{" "}
        <a href="/contact" className="underline-offset-2 hover:underline">Напишите нам</a>
      </div>
    </div>
  );
}

/* Мобильная карточка отзыва — вертикальная, крупный текст (как awwwards) */
function MobileReviewCard({ review, onRead }) {
  return (
    <div className="relative overflow-hidden rounded-[10px] bg-black text-white">
      <img
        src={review.bg}
        alt="Скан отзыва"
        className="absolute inset-0 h-full w-full object-cover brightness-[0.30]"
        loading="lazy"
        decoding="async"
      />
      <div aria-hidden="true" className="absolute inset-0 bg-black/[0.38]" />

      <div className="relative p-6">
        <div className="text-sm font-light leading-7 opacity-95">Отзыв клиента</div>
        <div className="mt-3 text-[30px] font-semibold leading-[36px]">
          {review.title.map((line, i) => (
            <React.Fragment key={i}>
              {line}
              {i !== review.title.length - 1 && <br />}
            </React.Fragment>
          ))}
        </div>
        {review.disabled ? (
          <button
            type="button"
            className="mt-7 inline-flex h-[56px] items-center justify-center rounded-[10px] px-6 text-base text-white ring-[0.5px] ring-inset ring-white transition-colors hover:bg-white hover:text-black"
          >
            Читать отзыв
          </button>
        ) : (
          <a
            href={review.pdf}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-7 inline-flex h-[56px] items-center justify-center rounded-[10px] px-6 text-base text-white ring-[0.5px] ring-inset ring-white transition-colors hover:bg-white hover:text-black"
          >
            Читать отзыв
          </a>
        )}
        <div className="mt-10 text-right text-sm font-light leading-6">
          Хотите оставить свой?{" "}
          <a href="/contact" className="underline-offset-2 hover:underline">Напишите нам</a>
        </div>
      </div>
    </div>
  );
}

/* Планшетная карточка отзыва — landscape (как awwwards): слева текст, скан справа затемнён */
function TabletReviewCard({ review, onRead }) {
  return (
    <div className="relative overflow-hidden rounded-[10px] bg-black text-white">
      {/* скан справа, затемнён и растворяется в чёрный слева */}
      <img
        src={review.bg}
        alt="Скан отзыва"
        className="absolute right-0 top-0 h-full w-[52%] object-cover brightness-[0.42]"
        loading="lazy"
        decoding="async"
      />
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-black via-black/85 to-black/25" />

      <div className="relative flex min-h-[320px] flex-col p-9">
        <div className="text-sm font-light leading-7 opacity-95">Отзыв клиента</div>
        <div className="mt-3 text-[32px] font-semibold leading-[38px]">
          {review.title.map((line, i) => (
            <React.Fragment key={i}>
              {line}
              {i !== review.title.length - 1 && <br />}
            </React.Fragment>
          ))}
        </div>
        {review.disabled ? (
          <button
            type="button"
            className="mt-7 inline-flex h-[56px] w-[176px] items-center justify-center rounded-[10px] text-base text-white ring-[0.5px] ring-inset ring-white transition-colors hover:bg-white hover:text-black"
          >
            Читать отзыв
          </button>
        ) : (
          <a
            href={review.pdf}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-7 inline-flex h-[56px] w-[176px] items-center justify-center rounded-[10px] text-base text-white ring-[0.5px] ring-inset ring-white transition-colors hover:bg-white hover:text-black"
          >
            Читать отзыв
          </a>
        )}
        <div className="mt-auto pt-10 text-sm font-light leading-7">
          Хотите оставить свой?{" "}
          <a href="/contact" className="underline-offset-2 hover:underline">Напишите нам</a>
        </div>
      </div>
    </div>
  );
}

export default function Reviews() {
  const [open, setOpen] = React.useState(null);

  return (
    <section className="bg-page pt-14 font-tight text-ink lg:pt-[96px] xl:pt-[126px]" aria-label="Отзывы">
      {/* Шапка */}
      <div className="text-center text-sm font-light leading-7">Портфолио</div>
      <div className="mt-[26px] text-center">
        <h2 className="font-semibold uppercase leading-none h-hero">ОТЗЫВЫ</h2>
        <p className="mt-3.5 text-[18px] font-light leading-7 sm:mt-4 sm:text-[21px] md:text-[19px] lg:text-[21px]">История сотрудничества</p>
      </div>

      {/* Карточки: на узких экранах — в столбик, карточка масштабируется под ширину (дизайн 1:1) */}
      <div className="mt-16 grid grid-cols-1 gap-6 px-4 lg:mx-[52px] lg:mt-20 lg:px-0 xl:grid-cols-2">
        {REVIEWS.map((r) => (
          <div key={r.bg} className="mx-auto w-full max-w-[710px] md:max-w-none xl:max-w-[710px]">
            {/* Мобилка — вертикальная карточка с крупным текстом */}
            <div className="md:hidden">
              <MobileReviewCard review={r} onRead={() => setOpen(r)} />
            </div>
            {/* Планшет + iPad Pro — landscape-карточка во всю ширину (как awwwards) */}
            <div className="hidden md:block xl:hidden">
              <TabletReviewCard review={r} onRead={() => setOpen(r)} />
            </div>
            {/* Десктоп ≥1280 — фиксированный дизайн 710×555 */}
            <div className="hidden xl:block">
              <FitScale baseW={710} baseH={555}>
                <ReviewCard review={r} onRead={() => setOpen(r)} />
              </FitScale>
            </div>
          </div>
        ))}
      </div>

      <div className="h-0 lg:h-[120px]" />

      {open && <ReviewModal review={open} onClose={() => setOpen(null)} />}
    </section>
  );
}
