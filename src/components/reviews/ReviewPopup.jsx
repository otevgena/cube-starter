// src/components/reviews/ReviewPopup.jsx
import React from "react";

export default function ReviewPopup({
  imageSrc = "/reviews/review1.png",
  fallbackSrc = "/reviews/review1.png",
  name = "",
  company = "",
  date = "",
  city = "",
}) {
  const [src, setSrc] = React.useState(imageSrc);

  // Более компактные колонки + адаптивные переносы
  const COLS = [
    { key: "name", w: 330, label: "Имя клиента" },
    { key: "comp", w: 300, label: "Компания" },
    { key: "date", w: 180, label: "Дата отзыва" },
    { key: "city", w: 180, label: "Город" },
  ];
  const HEADER_H = 56;
  const TEXT_SHIFT = 18;

  function DottedLine({ width }) {
    return (
      <div
        style={{
          width,
          height: 1,
          backgroundImage:
            "repeating-linear-gradient(to right, #000 0 1px, rgba(0,0,0,0) 1px 9px)",
        }}
      />
    );
  }

  function HeaderRow() {
    const totalW = COLS.reduce((s, c) => s + c.w, 0);
    return (
      <div style={{ width: totalW }}>
        <div
          style={{
            display: "flex",
            height: HEADER_H,
            fontFamily: "'Inter Tight','Inter',system-ui",
          }}
        >
          {COLS.map((c) => (
            <div
              key={c.key}
              style={{
                width: c.w,
                height: HEADER_H,
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-start",
                fontSize: 14,
                color: "#222",
                fontWeight: 400,
              }}
            >
              <span style={{ marginLeft: TEXT_SHIFT }}>{c.label}</span>
            </div>
          ))}
        </div>
        <DottedLine width={totalW} />
      </div>
    );
  }

  function Cell({ w, children }) {
    return (
      <div
        style={{
          width: w,
          display: "flex",
          alignItems: "flex-start",
          paddingTop: 10,
          paddingBottom: 10,
          minHeight: 56, // вместо фиксированной высоты строки
        }}
      >
        <div
          style={{
            marginLeft: TEXT_SHIFT,
            fontSize: 16,
            lineHeight: "24px",
            color: "#111",
            fontWeight: 400,
            wordBreak: "break-word",
            whiteSpace: "normal",
          }}
        >
          {children}
        </div>
      </div>
    );
  }

  function DataRow() {
    const totalW = COLS.reduce((s, c) => s + c.w, 0);
    return (
      <div style={{ width: totalW }}>
        <div
          style={{
            display: "flex",
            fontFamily: "'Inter Tight','Inter',system-ui",
            alignItems: "stretch",
          }}
        >
          <Cell w={COLS[0].w}>{name}</Cell>
          <Cell w={COLS[1].w}>{company}</Cell>
          <Cell w={COLS[2].w}>{date}</Cell>
          <Cell w={COLS[3].w}>{city}</Cell>
        </div>
        <DottedLine width={totalW} />
      </div>
    );
  }

  return (
    <div className="review-modal" style={{ fontFamily: "'Inter Tight','Inter',system-ui" }}>
      {/* Верх: hi-res «page1» */}
      <div
        style={{
          width: "100%",
          maxHeight: "62vh",
          overflow: "auto",
          background: "#111",
          display: "grid",
          placeItems: "center",
          borderBottom: "1px solid #e5e5e5",
        }}
      >
        <img
          src={src}
          alt="Страница отзыва"
          onError={() => setSrc(fallbackSrc)}
          style={{ width: "100%", height: "auto", display: "block" }}
          loading="eager"
          decoding="async"
        />
      </div>

      {/* Низ: таблица */}
      <div style={{ padding: "18px 20px 20px" }}>
        <HeaderRow />
        <DataRow />
      </div>
    </div>
  );
}
