// src/pages/contact.jsx
// Отдельная страница /contact рендерит тот же блок «Контакты», что и на главной
// (единый источник правды — src/components/blocks/Contact.jsx).
import React from "react";
import Contact from "@/components/blocks/Contact.jsx";

export default function ContactPage() {
  // на отдельной странице форма идёт сразу после шапки — подтягиваем выше
  return <Contact topClass="-mt-8" />;
}
