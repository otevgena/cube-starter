// src/components/blocks/Reviews.jsx
// Блок «Отзывы» (clean-rebuild): шапка + 2 карточки-скана.
// «Читать отзыв» открывает PDF отзыва в новой вкладке (удобный просмотр).
import React from "react";

const TITLE = { fontSize: "clamp(48px, 13.5vw, 137px)" };

const REVIEWS = [
  {
    bg: "/reviews/review1.png",
    pdf: "/reviews/review1.pdf",
    title: ["Опыт сотрудничества глазами", "наших заказчиков"],
  },
  {
    bg: "/reviews/review2.png",
    pdf: "/reviews/review2.pdf",
    title: ["Что говорят партнёры", "о результатах работы"],
  },
];

function ReviewCard({ bg, pdf, title }) {
  return (
    <div className="relative h-[555px] w-[710px] overflow-hidden rounded-[14px] bg-black text-white">
      <img
        src={bg}
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
          {title.map((line, i) => (
            <React.Fragment key={i}>
              {line}
              {i !== title.length - 1 && <br />}
            </React.Fragment>
          ))}
        </div>
        <div className="mt-9">
          <a
            href={pdf}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-[72px] w-[179px] items-center justify-center rounded-[14px] text-lg text-white ring-[0.5px] ring-inset ring-white transition-colors hover:bg-white hover:text-black"
          >
            Читать отзыв
          </a>
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
          <ReviewCard key={r.bg} bg={r.bg} pdf={r.pdf} title={r.title} />
        ))}
      </div>

      <div className="h-[120px]" />
    </section>
  );
}
