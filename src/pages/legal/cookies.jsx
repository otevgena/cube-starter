// src/pages/legal/cookies.jsx
import React from "react";

const UI = "'Inter Tight','Inter',system-ui";
const GUTTER = 80;
const BLACK = "#000";
const MUTED = "#A7A7A7";

export default function CookiesPage() {
  return (
    <main style={{ fontFamily: UI, color: BLACK, background: "#f8f8f8" }}>
      <style>{`
        .terms-tabs{
          text-align:center;
          margin-top:30px;
        }
        .terms-tabs a{
          color:${MUTED};
          text-decoration:none;
          transition:color .16s ease;
          letter-spacing:normal;
          font-size:14px;
          line-height:28px;
          font-weight:300;
          text-transform:uppercase;
          padding:0 10px;
        }
        .terms-tabs a:hover{ color:${BLACK}; }
        .terms-tabs a.is-active{ color:${BLACK}; }

        .terms-title{
          margin:0;
          text-transform:uppercase;
          font-weight:600;
          text-align:center;
        }
        .terms-sub{
          margin:0;
          text-align:center;
          font-size:21px;
          line-height:28px;
          font-weight:600;
          color:#222222;
        }

        .terms-h{
          margin:150px 0 8px 0;   /* 150px перед каждым заголовком */
          font-size:48px;
          line-height:1.15;
          font-weight:600;
        }
        .terms-p{
          margin:0 0 18px 0;
          font-size:24px;
          line-height:36px;
          font-weight:300;
          color:${BLACK};
        }
        .terms-list{
          margin:0;
          padding-left:22px;
          list-style:disc;
        }
        .terms-list li{
          margin:0 0 10px 0;
          font-size:24px;
          line-height:36px;
          font-weight:300;
          color:${BLACK};
        }
        .link-inline{
          color:${BLACK};
          text-decoration:none;
          font-weight:600;
        }
      `}</style>

      {/* Верхняя зона приподнята */}
      <div style={{ transform: "translateY(-61px)", willChange: "transform" }}>
        <div className="terms-tabs">
          <Tab to="/legal/cookies" active>Политика cookie</Tab>
          <Tab to="/legal/terms">Правовые положения</Tab>
          <Tab to="/legal/privacy">Политика конфиденциальности</Tab>
        </div>

        {/* Заголовок — каждое слово с новой строки */}
        <div style={{ textAlign: "center", position: "relative", marginTop: 2 }}>
          <h2 className="terms-title about-hero-title">
            <span style={{ display: "block" }}>ПОЛИТИКА</span>
            <span style={{ display: "block" }}>COOKIE</span>
          </h2>
        </div>

        {/* Подзаголовок — три строки, без паддингов чтобы не увеличивать зазор */}
        <div style={{ background: "#f8f8f8", marginTop: 12, marginBottom: 0, padding: 0 }}>
          <p className="terms-sub">
            На этой странице описывается, какую информацию они собирают,<br/>
            как мы ее используем<br/>
            и почему нам иногда необходимо хранить эти файлы cookie.
          </p>
        </div>
      </div>

      {/* Контент: компенсируем -61px, чтобы до 1-го h3 было ровно 150px */}
      <div style={{ marginTop: -61, marginLeft: GUTTER, marginRight: GUTTER }}>
        <h3 className="terms-h">Что такое cookie</h3>
        <p className="terms-p">
          Как и большинство современных сайтов, наш сайт использует файлы cookie — это небольшие текстовые файлы, которые
          сохраняются на вашем устройстве для улучшения работы и удобства при использовании сайта.
        </p>
        <p className="terms-p">
          На этой странице описано, какую информацию собирают cookie, как мы их используем и почему иногда необходимо их
          хранить. Также мы расскажем, как можно отключить cookie, однако это может повлиять на работу некоторых функций сайта.
        </p>
        <p className="terms-p">
          Более подробно о cookie вы можете узнать в статье на{" "}
          <a className="link-inline" href="https://ru.wikipedia.org/wiki/Cookie" target="_blank" rel="noreferrer">Wikipedia</a>.
        </p>

        <h3 className="terms-h">Как мы используем cookie</h3>
        <p className="terms-p">
          Мы применяем cookie по разным причинам, перечисленным ниже. К сожалению, чаще всего не существует стандартных
          способов отключить cookie без потери части функционала сайта. Поэтому рекомендуется оставлять cookie включёнными,
          если вы не уверены, нужны они вам или нет — они могут быть необходимы для корректной работы сервисов,
          которые вы используете.
        </p>

        <h3 className="terms-h">Отключение cookie</h3>
        <p className="terms-p">
          Вы можете запретить использование cookie, изменив настройки браузера (см. справку вашего браузера). Но имейте в виду:
          отключение cookie повлияет на работу многих сайтов, включая наш. В большинстве случаев это приведёт к ограничению функциональности.
        </p>

        <h3 className="terms-h">Какие cookie мы используем</h3>
        <ul className="terms-list">
          <li>
            <strong style={{ fontWeight: 600 }}>Регистрация и аккаунт.</strong> При создании учётной записи cookie помогают управлять процессом регистрации и настройками.
            Чаще всего они удаляются при выходе из аккаунта, но иногда сохраняются, чтобы помнить ваши предпочтения.
          </li>
          <li>
            <strong style={{ fontWeight: 600 }}>Авторизация.</strong> Cookie фиксируют факт входа на сайт, чтобы вам не приходилось вводить данные при каждом переходе на новую страницу.
          </li>
          <li>
            <strong style={{ fontWeight: 600 }}>Формы и заявки.</strong> При отправке данных через формы (например, заявки или обратная связь) cookie могут сохранять ваши данные
            для удобства при последующих обращениях.
          </li>
          <li>
            <strong style={{ fontWeight: 600 }}>Подписки.</strong> Если сайт предоставляет рассылки или уведомления, cookie могут определять, зарегистрированы вы или нет.
          </li>
          <li>
            <strong style={{ fontWeight: 600 }}>Оплата и заказы.</strong> Если предусмотрены онлайн-услуги или платежи, cookie помогают корректно обрабатывать ваши заказы
            и сохранять их между страницами.
          </li>
        </ul>

        <h3 className="terms-h">Cookie третьих сторон</h3>
        <ul className="terms-list">
          <li>
            <strong style={{ fontWeight: 600 }}>Google Analytics.</strong> Служит для анализа посещаемости и улучшения работы сайта (например, отслеживание времени нахождения
            на сайте и просматриваемых страниц). Подробнее читайте на официальной странице{" "}
            <a className="link-inline" href="https://marketingplatform.google.com/about/analytics/terms/ru/" target="_blank" rel="noreferrer">Google Analytics</a>.
          </li>
          <li>
            <strong style={{ fontWeight: 600 }}>Google AdSense.</strong> Использует cookie DoubleClick для показа более релевантной рекламы и ограничения частоты показов.
            Подробнее в <a className="link-inline" href="https://support.google.com/adsense/answer/48182?hl=ru" target="_blank" rel="noreferrer">FAQ Google AdSense</a>.
          </li>
          <li>
            <strong style={{ fontWeight: 600 }}>Социальные сети.</strong> Кнопки и плагины (например, VK) могут сохранять свои cookie, чтобы улучшить ваш профиль или
            использовать данные в соответствии с их политиками конфиденциальности.
          </li>
        </ul>

        <h3 className="terms-h">Дополнительная информация</h3>
        <p className="terms-p">
          Если у вас остались вопросы или вы хотите уточнить детали использования cookie на нашем сайте, вы можете связаться с нами:
        </p>
        <p className="terms-p">
          <a href="mailto:info@cube-tech.ru" className="link-inline">info@cube-tech.ru</a>
        </p>

        <div style={{ height: 58 }} />
      </div>
    </main>
  );
}

function Tab({ to, active, children }) {
  const onClick = (e) => {
    e.preventDefault();
    try {
      window.history.pushState({}, "", to);
      window.dispatchEvent(new PopStateEvent("popstate"));
    } catch {}
  };
  return (
    <a href={to} onClick={onClick} className={active ? "is-active" : ""}>
      {children}
    </a>
  );
}
