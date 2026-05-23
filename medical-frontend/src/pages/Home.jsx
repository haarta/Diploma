import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { newsApi, promotionsApi } from '../api';
import ExpandableNewsCard from '../components/ExpandableNewsCard';

const promotionDateFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
});

const formatDate = (value) => {
  if (!value) {
    return '';
  }

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return promotionDateFormatter.format(date);
};

const formatPromotionPeriod = (promotion) => {
  if (promotion.activeFrom && promotion.activeTo) {
    return `С ${formatDate(promotion.activeFrom)} по ${formatDate(promotion.activeTo)}`;
  }
  if (promotion.activeFrom) {
    return `С ${formatDate(promotion.activeFrom)}`;
  }
  if (promotion.activeTo) {
    return `До ${formatDate(promotion.activeTo)}`;
  }
  return '';
};

function PromotionPreviewCard({ promotion }) {
  const period = formatPromotionPeriod(promotion);

  return (
    <article className="promotion-preview-card">
      {promotion.imageUrl ? (
        <img className="promotion-preview-card__image" src={promotion.imageUrl} alt={promotion.title} />
      ) : (
        <div className="promotion-preview-card__image promotion-preview-card__image--placeholder">АКЦИЯ</div>
      )}
      <div className="promotion-preview-card__content">
        <h3>{promotion.title}</h3>
        <p>{promotion.shortDescription}</p>
        {period ? <span className="promotion-period">{period}</span> : null}
      </div>
    </article>
  );
}

export default function Home() {
  const newsViewportRef = useRef(null);
  const [visibleNewsCount, setVisibleNewsCount] = useState(1);
  const [newsStartIndex, setNewsStartIndex] = useState(0);

  const { data: newsItems = [], isLoading: newsLoading } = useQuery({
    queryKey: ['public-news'],
    queryFn: async () => {
      const response = await newsApi.getAll();
      return response.data || [];
    },
  });

  const { data: promotions = [] } = useQuery({
    queryKey: ['public-promotions'],
    queryFn: async () => {
      const response = await promotionsApi.getAll();
      return response.data || [];
    },
  });

  useEffect(() => {
    const viewport = newsViewportRef.current;

    if (!viewport) {
      return undefined;
    }

    const updateVisibleNewsCount = () => {
      if (newsItems.length === 0) {
        setVisibleNewsCount(0);
        setNewsStartIndex(0);
        return;
      }

      const width = viewport.clientWidth;
      const gap = width <= 760 ? 16 : 24;
      const minCardWidth = width <= 760 ? 280 : 320;
      const nextVisibleCount = Math.max(
        1,
        Math.min(newsItems.length, Math.floor((width + gap) / (minCardWidth + gap))),
      );

      setVisibleNewsCount(nextVisibleCount);
      setNewsStartIndex((currentIndex) => Math.min(currentIndex, Math.max(0, newsItems.length - nextVisibleCount)));
    };

    updateVisibleNewsCount();

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', updateVisibleNewsCount);
      return () => window.removeEventListener('resize', updateVisibleNewsCount);
    }

    const resizeObserver = new ResizeObserver(() => {
      updateVisibleNewsCount();
    });

    resizeObserver.observe(viewport);

    return () => resizeObserver.disconnect();
  }, [newsItems.length]);

  const maxNewsStartIndex = Math.max(0, newsItems.length - visibleNewsCount);
  const visibleNewsItems = visibleNewsCount > 0
    ? newsItems.slice(newsStartIndex, newsStartIndex + visibleNewsCount)
    : [];

  const showPreviousNews = () => {
    setNewsStartIndex((currentIndex) => Math.max(0, currentIndex - visibleNewsCount));
  };

  const showNextNews = () => {
    setNewsStartIndex((currentIndex) => Math.min(maxNewsStartIndex, currentIndex + visibleNewsCount));
  };

  return (
    <div className="home">
      <section className="hero">
        <div className="hero-layout">
          <div className="hero-content">
            <span className="hero-badge">Частная медицинская клиника</span>
            <h1>Медицинская клиника «Здоровье»</h1>

            <div className="hero-actions">
              <Link to="/appointments" className="btn btn-primary hero-cta">
                Записаться на прием
              </Link>
              <span className="hero-caption">Подберем удобное время приема и нужного специалиста</span>
            </div>

            <div className="hero-benefits" aria-label="Преимущества клиники">
              <div className="hero-benefit">
                <span className="hero-benefit__marker" aria-hidden="true" />
                <span>Персональный подход</span>
              </div>
              <div className="hero-benefit">
                <span className="hero-benefit__marker" aria-hidden="true" />
                <span>Точная диагностика</span>
              </div>
              <div className="hero-benefit">
                <span className="hero-benefit__marker" aria-hidden="true" />
                <span>Комфорт без очередей</span>
              </div>
            </div>
          </div>

          <aside className="hero-panel" aria-label="Преимущества сервиса">
            <div className="hero-panel__header">
              <span className="hero-panel__eyebrow">Комфортный сервис</span>
              <p>Продуманная организация приема и внимательное сопровождение пациента на каждом этапе.</p>
            </div>

            <div className="hero-metrics">
              <div className="hero-metric">
                <strong>15+</strong>
                <span>лет практики у ведущих специалистов</span>
              </div>
              <div className="hero-metric">
                <strong>7</strong>
                <span>дней в неделю доступна запись</span>
              </div>
              <div className="hero-metric">
                <span>На каждом этапе внимательное сопровождение пациента</span>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="features">
        <div className="feature-card">
          <div className="feature-icon">👨‍⚕️</div>
          <h3>Опытные врачи</h3>
          <p>Специалисты высокой квалификации с практическим опытом и внимательным подходом.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🏥</div>
          <h3>Современное оборудование</h3>
          <p>Диагностика и лечение на актуальном медицинском оборудовании с точными результатами.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">📋</div>
          <h3>Быстрое обслуживание</h3>
          <p>Удобная запись на прием, понятный личный кабинет и минимальное время ожидания.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">💊</div>
          <h3>Полный спектр услуг</h3>
          <p>От первичной консультации и анализов до лечения, наблюдения и восстановления.</p>
        </div>
      </section>

      <section className="news-ribbon">
        <div className="news-ribbon__header">
          <div>
            <span className="news-ribbon__eyebrow">Новости</span>
            <h2>Что нового в клинике</h2>
            <p>Анонсы программ, изменения в расписании и короткие обновления, которые можно быстро пролистать.</p>
          </div>
          <Link to="/news" className="btn btn-secondary">Все новости</Link>
        </div>

        {newsLoading ? (
          <div className="news-ribbon__state">Загрузка новостей...</div>
        ) : newsItems.length === 0 ? (
          <div className="news-ribbon__state">Опубликованных новостей пока нет.</div>
        ) : (
          <div className="news-ribbon__carousel">
            <button
              type="button"
              className="news-ribbon__nav news-ribbon__nav--prev"
              onClick={showPreviousNews}
              aria-label="Прокрутить новости назад"
              disabled={newsStartIndex === 0}
            >
              <span aria-hidden="true">‹</span>
            </button>

            <div className="news-ribbon__viewport" ref={newsViewportRef}>
              <div className="news-ribbon__track" style={{ '--news-visible-count': visibleNewsItems.length || 1 }}>
                {visibleNewsItems.map((item) => (
                  <ExpandableNewsCard key={item.id} item={item} variant="ribbon" />
                ))}
              </div>
            </div>

            <button
              type="button"
              className="news-ribbon__nav news-ribbon__nav--next"
              onClick={showNextNews}
              aria-label="Прокрутить новости вперед"
              disabled={newsStartIndex >= maxNewsStartIndex}
            >
              <span aria-hidden="true">›</span>
            </button>
          </div>
        )}
      </section>

      <section className="home-promotions">
        <div className="home-promotions__head">
          <div>
            <h2>Актуальные акции</h2>
            <p>Специальные предложения клиники, которыми можно воспользоваться прямо сейчас.</p>
          </div>
          <Link to="/promotions" className="btn btn-secondary">Все акции</Link>
        </div>

        {promotions.length ? (
          <div className="promotion-preview-grid">
            {promotions.slice(0, 3).map((promotion) => (
              <PromotionPreviewCard key={promotion.id} promotion={promotion} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <h3>Акций пока нет</h3>
            <p>Новые предложения появятся здесь после публикации в админке.</p>
          </div>
        )}
      </section>

      <style>{`
        .hero {
          position: relative;
          overflow: hidden;
          background:
            radial-gradient(circle at top left, rgba(255, 255, 255, 0.95), transparent 34%),
            radial-gradient(circle at 88% 18%, rgba(120, 197, 178, 0.24), transparent 24%),
            linear-gradient(135deg, #f7fffc 0%, #eefaf6 52%, #e3f2ee 100%);
          color: #183a37;
          padding: 40px;
          border-radius: 32px;
          margin-bottom: 40px;
          border: 1px solid rgba(81, 142, 131, 0.18);
          box-shadow: 0 28px 68px rgba(90, 128, 120, 0.16);
        }

        .hero::before,
        .hero::after {
          content: '';
          position: absolute;
          border-radius: 999px;
          pointer-events: none;
        }

        .hero::before {
          width: 260px;
          height: 260px;
          right: -70px;
          top: -80px;
          background: radial-gradient(circle, rgba(120, 197, 178, 0.26), transparent 70%);
        }

        .hero::after {
          width: 220px;
          height: 220px;
          left: 48%;
          bottom: -120px;
          background: radial-gradient(circle, rgba(255, 255, 255, 0.92), transparent 72%);
        }

        .hero-layout {
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-columns: minmax(0, 1.35fr) minmax(280px, 0.9fr);
          gap: 28px;
          align-items: center;
        }

        .hero-content {
          display: grid;
          gap: 18px;
          text-align: left;
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          justify-self: start;
          padding: 10px 16px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.72);
          border: 1px solid rgba(81, 142, 131, 0.18);
          color: #426c66;
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.75);
        }

        .hero-content h1 {
          margin: 0;
          max-width: 720px;
          font-size: clamp(2.5rem, 4vw, 4rem);
          line-height: 1.02;
          color: #143836;
        }

        .hero-content p {
          margin: 0;
          max-width: 640px;
          font-size: 1.08rem;
          line-height: 1.7;
          color: #5a736f;
        }

        .hero-actions {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px 18px;
          margin-top: 8px;
        }

        .hero-cta {
          padding: 18px 32px;
          border-radius: 999px;
          background: linear-gradient(135deg, #2f8176 0%, #23695f 100%);
          box-shadow: 0 18px 36px rgba(35, 105, 95, 0.22);
          font-size: 1.04rem;
          font-weight: 600;
        }

        .hero-cta:hover {
          background: linear-gradient(135deg, #367f75 0%, #215c55 100%);
          box-shadow: 0 22px 40px rgba(35, 105, 95, 0.26);
        }

        .hero-caption {
          color: #6e8480;
          font-size: 0.96rem;
        }

        .hero-benefits {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          align-items: start;
          gap: 18px;
          margin-top: 10px;
          padding-top: 18px;
          border-top: 1px solid rgba(81, 142, 131, 0.16);
        }

        .hero-benefit {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #355f59;
          font-size: 0.96rem;
          line-height: 1.45;
          min-width: 0;
        }

        .hero-benefit__marker {
          width: 10px;
          height: 10px;
          flex: 0 0 10px;
          border-radius: 999px;
          background: linear-gradient(135deg, #4f9a8d 0%, #2f8176 100%);
          box-shadow: 0 0 0 5px rgba(79, 154, 141, 0.12);
        }

        .hero-benefit span:last-child {
          display: block;
        }

        .hero-panel {
          position: relative;
          padding: 28px;
          border-radius: 28px;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.84), rgba(246, 253, 250, 0.94));
          border: 1px solid rgba(81, 142, 131, 0.18);
          box-shadow: 0 22px 44px rgba(83, 117, 112, 0.12);
          backdrop-filter: blur(18px);
        }

        .hero-panel__header {
          display: grid;
          gap: 10px;
          margin-bottom: 20px;
        }

        .hero-panel__eyebrow {
          color: #2c6d64;
          font-size: 0.82rem;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }

        .hero-panel__header p {
          margin: 0;
          color: #617b76;
          font-size: 0.98rem;
          line-height: 1.65;
        }

        .hero-metrics {
          display: grid;
          gap: 14px;
        }

        .hero-metric {
          display: grid;
          gap: 6px;
          padding: 16px 18px;
          border-radius: 22px;
          background: rgba(255, 255, 255, 0.72);
          border: 1px solid rgba(81, 142, 131, 0.14);
        }

        .hero-metric span {
          color: #5d7571;
          line-height: 1.5;
        }

        .features {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-bottom: 40px;
        }

        .feature-card {
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(248, 243, 255, 0.95));
          padding: 30px;
          border-radius: 18px;
          text-align: center;
          border: 1px solid rgba(155, 122, 232, 0.12);
          box-shadow: 0 10px 30px rgba(123, 109, 156, 0.08);
          transition: transform 0.3s, box-shadow 0.3s, border-color 0.3s;
        }

        .feature-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 18px 32px rgba(155, 122, 232, 0.14);
          border-color: rgba(155, 122, 232, 0.24);
        }

        .feature-icon {
          font-size: 3em;
          margin-bottom: 16px;
        }

        .feature-card h3 {
          color: #7f62c9;
          margin-bottom: 10px;
        }

        .news-ribbon {
          margin-bottom: 48px;
          padding: 28px 0 8px;
        }

        .news-ribbon__header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 20px;
          margin-bottom: 26px;
          flex-wrap: wrap;
        }

        .news-ribbon__eyebrow {
          display: inline-flex;
          align-items: center;
          padding: 8px 14px;
          border-radius: 999px;
          margin-bottom: 12px;
          background: rgba(249, 131, 52, 0.12);
          color: #d86d20;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .news-ribbon__header h2 {
          margin-bottom: 10px;
          color: #352b4e;
          font-size: clamp(2rem, 3vw, 2.6rem);
          font-weight: 500;
        }

        .news-ribbon__header p {
          max-width: 720px;
          margin: 0;
          color: #6b6280;
          font-size: 1rem;
          line-height: 1.6;
        }

        .news-ribbon__state {
          padding: 28px;
          border-radius: 24px;
          background: rgba(255, 255, 255, 0.88);
          border: 1px solid rgba(125, 151, 196, 0.14);
          color: #5f6475;
        }

        .news-ribbon__carousel {
          display: grid;
          grid-template-columns: 52px minmax(0, 1fr) 52px;
          gap: 18px;
          align-items: center;
        }

        .news-ribbon__viewport {
          min-width: 0;
          overflow: hidden;
        }

        .news-ribbon__track {
          display: grid;
          grid-template-columns: repeat(var(--news-visible-count), minmax(0, 1fr));
          gap: 24px;
          padding: 4px 2px 16px;
        }

        .news-ribbon__nav {
          width: 52px;
          height: 52px;
          border: 1px solid rgba(53, 43, 78, 0.18);
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.92);
          color: #352b4e;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 12px 26px rgba(53, 43, 78, 0.08);
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
        }

        .news-ribbon__nav:hover {
          transform: translateY(-2px);
          border-color: rgba(53, 43, 78, 0.32);
          box-shadow: 0 16px 32px rgba(53, 43, 78, 0.12);
        }

        .news-ribbon__nav:disabled {
          cursor: default;
          opacity: 0.45;
          transform: none;
          box-shadow: none;
        }

        .news-ribbon__nav:disabled:hover {
          border-color: rgba(53, 43, 78, 0.18);
          box-shadow: none;
        }

        .news-ribbon__nav span {
          font-size: 30px;
          line-height: 1;
          transform: translateY(-1px);
        }

        .home-promotions {
          margin-top: 48px;
        }

        .home-promotions__head {
          display: flex;
          justify-content: space-between;
          align-items: end;
          gap: 20px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }

        .home-promotions__head h2 {
          color: #7f62c9;
          margin-bottom: 8px;
        }

        .home-promotions__head p {
          color: #6b6280;
          margin: 0;
        }

        .promotion-preview-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
        }

        .promotion-preview-card {
          display: grid;
          grid-template-columns: 120px 1fr;
          gap: 16px;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.95), rgba(243, 247, 255, 0.96));
          border-radius: 22px;
          border: 1px solid rgba(125, 151, 196, 0.18);
          overflow: hidden;
          box-shadow: 0 18px 40px rgba(110, 130, 170, 0.12);
        }

        .promotion-preview-card__image {
          width: 100%;
          height: 100%;
          min-height: 160px;
          object-fit: cover;
          background: linear-gradient(135deg, #12bff6, #dff5ff);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          letter-spacing: 0.08em;
        }

        .promotion-preview-card__content {
          padding: 18px 18px 18px 0;
        }

        .promotion-preview-card__content h3 {
          margin-bottom: 10px;
          color: #50627f;
        }

        .promotion-preview-card__content p {
          margin-bottom: 14px;
          color: #65748b;
        }

        .promotion-period {
          display: inline-block;
          padding: 6px 12px;
          border-radius: 999px;
          background: rgba(18, 191, 246, 0.1);
          color: #1880a7;
          font-size: 0.85rem;
          font-weight: 600;
        }

        @media (max-width: 760px) {
          .hero {
            padding: 28px 22px;
            border-radius: 28px;
          }

          .hero-layout {
            grid-template-columns: 1fr;
          }

          .hero-content {
            gap: 16px;
          }

          .hero-content h1 {
            font-size: clamp(2.1rem, 10vw, 3rem);
          }

          .hero-actions {
            align-items: stretch;
          }

          .hero-cta {
            width: 100%;
          }

          .hero-caption {
            max-width: 30ch;
          }

          .hero-benefits {
            grid-template-columns: 1fr;
            gap: 12px;
          }

          .hero-panel {
            padding: 22px;
          }

          .news-ribbon {
            padding-top: 10px;
          }

          .news-ribbon__carousel {
            grid-template-columns: 44px minmax(0, 1fr) 44px;
            gap: 12px;
          }

          .news-ribbon__track {
            gap: 16px;
          }

          .news-ribbon__nav {
            width: 44px;
            height: 44px;
          }

          .promotion-preview-card {
            grid-template-columns: 1fr;
          }

          .promotion-preview-card__content {
            padding: 0 18px 18px;
          }
        }
      `}</style>
    </div>
  );
}
