// src/components/blocks/Reviews.jsx
import React from "react";
import ReviewPopup from "@/components/reviews/ReviewPopup.jsx";

export default function Reviews() {
  const CARD_W = 710, CARD_H = 555;
  const PAD = 62;
  const BTM = 32;

  function openReviewModal(payload) {
    const y = window.scrollY || window.pageYOffset || 0;               // <- запоминаем позицию
    const width = Math.max(820, Math.min(1600, Math.round(window.innerWidth * 0.7)));

    // открываем БЕЗ "Понятно" — см. крошечную вставку в Modals.jsx ниже
window.openModal?.("review", {
  width,
  backdropOpacity: 0.35,   // ← НОВОЕ: чуть светлее, фон «просматривается»
  content: (
    <ReviewPopup
      imageSrc={payload.imageSrc}
      fallbackSrc={payload.fallbackSrc}
      name={payload.name}
      company={payload.company}
      date={payload.date}
      city={payload.city}
    />
  ),
});


    // на всякий — возвращаемся ровно туда же
    requestAnimationFrame(() => window.scrollTo(0, y));
    setTimeout(() => window.scrollTo(0, y), 0);
  }

  function ReadButton({ onClick }) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation(); // не даём «прыгать»
          onClick?.(e);
        }}
        onMouseDown={(e) => { e.preventDefault(); }} // блок фокуса-скролла
        style={{
          width: 179,
          height: 72,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          background: "transparent",
          color: "#fff",
          boxShadow: "inset 0 0 0 1px #ffffff",
          border: "none",
          borderRadius: 14,
          cursor: "pointer",
          fontFamily: "'Inter Tight','Inter',system-ui",
          fontSize: 18,
          fontWeight: 400,
          transition: "background-color 160ms ease, color 160ms ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "#fff";
          e.currentTarget.style.color = "#000";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = "#fff";
        }}
      >
        Читать отзыв
      </button>
    );
  }

  function ReviewCard({ imageSrc, titleLines, onRead }) {
    return (
      <div
        style={{
          position: "relative",
          width: CARD_W,
          height: CARD_H,
          background: "#000",
          borderRadius: 14,
          overflow: "hidden",
          color: "#fff",
          fontFamily: "'Inter Tight','Inter',system-ui",
        }}
      >
        {/* Фон-изображение (слегка затемнено) */}
        <img
          src={imageSrc}
          alt="Скан отзыва"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
            filter: "brightness(0.30)",
          }}
          loading="lazy"
          decoding="async"
        />
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.38)",
          }}
        />

        {/* Верхний контент */}
        <div
          style={{
            position: "absolute",
            left: PAD,
            top: PAD,
            right: PAD,
            textAlign: "left",
          }}
        >
          <div style={{ fontSize: 14, lineHeight: "28px", fontWeight: 300, opacity: 0.95 }}>
            Отзыв клиента
          </div>

          <div style={{ marginTop: 14, fontSize: 43, lineHeight: "50px", fontWeight: 600 }}>
            {titleLines.map((line, i) => (
              <React.Fragment key={i}>
                {line}
                {i !== titleLines.length - 1 && <br />}
              </React.Fragment>
            ))}
          </div>

          <div style={{ marginTop: 35 }}>
            <ReadButton onClick={onRead} />
          </div>
        </div>

        {/* Нижняя строка справа */}
        <div
          style={{
            position: "absolute",
            right: PAD,
            bottom: BTM,
            left: PAD,
            fontSize: 14,
            lineHeight: "28px",
            fontWeight: 300,
            textAlign: "right",
          }}
        >
          Хотите оставить свой?{" "}
          <a
            href="/contact"
            className="about-hero-role"
            style={{ textDecoration: "none", color: "#ffffff", display: "inline-block" }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              try {
                window.history.pushState({}, "", "/contact");
                window.dispatchEvent(new PopStateEvent("popstate"));
              } catch {
                window.location.assign("/contact");
              }
            }}
          >
            Напишите нам
          </a>
        </div>
      </div>
    );
  }

  return (
    <section id="reviews" className="reviews-hero" aria-label="Отзывы">
      <div className="about-hero-header" style={{ transform: "translateY(-74px)", willChange: "transform" }}>
        <div className="container-wide">
          <div className="projects-hero-flow" style={{ marginTop: "200px" }}>
            <div
              className="about-hero-overview"
              style={{
                textAlign: "center",
                fontFamily: "'Inter Tight','Inter',system-ui",
                fontSize: "14px",
                lineHeight: "28px",
                fontWeight: 300,
                color: "#222222",
                margin: 0,
              }}
            >
              Портфолио
            </div>

            <div
              className="about-hero-more"
              style={{ textAlign: "center", fontFamily: "'Inter Tight','Inter',system-ui", position: "relative" }}
            >
              <h2
                className="about-hero-title"
                style={{ margin: 0, marginTop: "25px", textTransform: "uppercase", fontWeight: 600 }}
              >
                ОТЗЫВЫ
              </h2>
              <p
                className="about-hero-more-sub"
                style={{
                  marginTop: "15px",
                  fontSize: "20.9859px",
                  lineHeight: "28px",
                  fontWeight: 300,
                  color: "#222222",
                }}
              >
                История сотрудничества
              </p>
            </div>
          </div>
        </div>

        <div
          style={{
            marginTop: 82,
            marginLeft: 52,
            marginRight: 52,
            display: "grid",
            gridTemplateColumns: "710px 710px",
            justifyContent: "space-between",
            alignItems: "start",
            rowGap: 24,
          }}
        >
          {/* Левый блок — с вашими данными */}
          <ReviewCard
            imageSrc="/reviews/review1.png"
            titleLines={["Опыт сотрудничества глазами", "наших заказчиков"]}
            onRead={() =>
              openReviewModal({
                imageSrc: "/reviews/review1-page1.png",
                fallbackSrc: "/reviews/review1.png",
                name: "Цыганков Валентин Иванович",
                company: "Альянс Недвижимость",
                date: "04.09.2025",
                city: "Ноябрьск",
              })
            }
          />

          {/* Правый блок — подставишь свои метаданные позже */}
          <ReviewCard
            imageSrc="/reviews/review2.png"
            titleLines={["Что говорят партнёры", "о результатах работы"]}
            onRead={() =>
              openReviewModal({
                imageSrc: "/reviews/review2-page1.png",
                fallbackSrc: "/reviews/review2.png",
                name: "",
                company: "",
                date: "",
                city: "",
              })
            }
          />
        </div>

        <div style={{ height: 120 }} />
      </div>
    </section>
  );
}
