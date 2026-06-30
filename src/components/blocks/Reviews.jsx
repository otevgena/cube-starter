// src/components/blocks/Reviews.jsx
// Блок «Отзывы» (clean-rebuild): шапка + 2 карточки-скана.
// «Читать отзыв» открывает модалку с PDF; снизу закреплена плашка с данными клиента.
import React from "react";
import { createPortal } from "react-dom";

const TITLE = { fontSize: "clamp(48px, 13.5vw, 137px)" };

const REVIEWS = [
  {
    bg: "/reviews/review1.png",
    pdf: "/reviews/review1.pdf",
    title: ["Опыт сотрудничества глазами", "наших заказчиков"],
    name: "Цыганков В. И.",
    company: "Альянс Недвижимость",
    date: "04.09.2025",
    city: "Ноябрьск",
  },
  {
    bg: "/reviews/review2.png",
    pdf: "/reviews/review2.pdf",
    title: ["Что говорят партнёры", "о результатах работы"],
    name: "",
    company: "",
    date: "",
    city: "",
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
    <div className="fixed inset-0 z-[100] grid place-items-center p-4 font-tight">
      <div className="absolute inset-0 bg-black/55" onClick={onClose} />

      <div className="relative flex h-[90vh] w-full max-w-[920px] animate-svcfade flex-col overflow-hidden rounded-2xl bg-[#ededed] shadow-2xl">
        {/* PDF как документ в паспарту: рамка нашего цвета со всех сторон.
            Белый контейнер скруглён → скролл просмотрщика прячется внутрь документа. */}
        <div className="min-h-0 flex-1 px-5 pt-5">
          <div className="h-full overflow-hidden rounded-lg bg-white">
            <iframe
              src={`${review.pdf}#toolbar=0&navpanes=0&view=FitH`}
              title="Отзыв клиента"
              className="h-full w-full border-0 bg-white"
            />
          </div>
        </div>

        {/* закреплённая плашка с данными — в стиле таблицы проектов */}
        <div className="bg-[#ededed] px-5 pb-5 pt-4">
          <div className="grid grid-cols-4 gap-6 text-sm font-light text-neutral-500">
            <span>Имя клиента</span>
            <span>Компания</span>
            <span>Дата</span>
            <span>Город</span>
          </div>
          <div
            className="my-3 h-px w-full"
            style={{ backgroundImage: "repeating-linear-gradient(to right, #000 0 1px, rgba(0,0,0,0) 1px 9px)" }}
          />
          <div className="grid grid-cols-4 gap-6 text-[16px] font-normal text-dark">
            <span className="truncate">{review.name || "—"}</span>
            <span className="truncate">{review.company || "—"}</span>
            <span>{review.date || "—"}</span>
            <span>{review.city || "—"}</span>
          </div>
        </div>
      </div>

      {/* крестик — как в модалках (внизу справа, на месте дока) */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Закрыть"
        title="Закрыть"
        className="fixed right-6 z-[101] grid h-[60px] w-[60px] place-items-center rounded-xl bg-[#111] text-white shadow-xl transition-transform hover:-translate-y-px"
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
    <div className="relative h-[555px] w-[710px] overflow-hidden rounded-[14px] bg-black text-white">
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
            onClick={onRead}
            className="inline-flex h-[72px] w-[179px] items-center justify-center rounded-[14px] text-lg text-white ring-[0.5px] ring-inset ring-white transition-colors hover:bg-white hover:text-black"
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

export default function Reviews() {
  const [open, setOpen] = React.useState(null);

  return (
    <section className="bg-page pt-[126px] font-tight text-ink" aria-label="Отзывы">
      {/* Шапка */}
      <div className="text-center text-sm font-light leading-7">Портфолио</div>
      <div className="mt-[26px] text-center">
        <h2 className="font-semibold uppercase leading-none" style={TITLE}>ОТЗЫВЫ</h2>
        <p className="mt-4 text-[21px] font-light leading-7">История сотрудничества</p>
      </div>

      {/* Карточки */}
      <div className="mx-[52px] mt-20 flex justify-between gap-6">
        {REVIEWS.map((r) => (
          <ReviewCard key={r.bg} review={r} onRead={() => setOpen(r)} />
        ))}
      </div>

      <div className="h-[120px]" />

      {open && <ReviewModal review={open} onClose={() => setOpen(null)} />}
    </section>
  );
}
