import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { newsApi, promotionsApi } from '../api';
import ExpandableNewsCard from '../components/ExpandableNewsCard';
import PromotionDetailsModal from '../components/PromotionDetailsModal';
import { formatPromotionPeriod } from '../utils/promotions';
import '../styles/Home.css';

const HOME_STATS_ITEMS = [
  { id: 'appointments', value: '7 420', label: 'записей на прием оформлено' },
  { id: 'tests', value: '3 860', label: 'лабораторных исследований выполнено' },
  { id: 'checkups', value: '1 240', label: 'профосмотров и справок оформлено' },
  { id: 'diagnostics', value: '4 580', label: 'диагностических процедур проведено' },
];

function HomeStatVisual({ id }) {
  switch (id) {
    case 'appointments':
      return (
        <div className="home-stat-visual home-stat-visual--appointments" aria-hidden="true">
          <span className="home-stat-visual__notepad">
            <span className="home-stat-visual__notepad-spiral" />
            <span className="home-stat-visual__notepad-line home-stat-visual__notepad-line--1" />
            <span className="home-stat-visual__notepad-line home-stat-visual__notepad-line--2" />
            <span className="home-stat-visual__notepad-line home-stat-visual__notepad-line--3" />
          </span>
          <span className="home-stat-visual__pen">
            <span className="home-stat-visual__pen-tip" />
          </span>
        </div>
      );
    case 'tests':
      return (
        <div className="home-stat-visual home-stat-visual--tests" aria-hidden="true">
          <span className="home-stat-visual__tube">
            <span className="home-stat-visual__tube-fill home-stat-visual__tube-fill--1" />
          </span>
          <span className="home-stat-visual__tube">
            <span className="home-stat-visual__tube-fill home-stat-visual__tube-fill--2" />
          </span>
          <span className="home-stat-visual__tube">
            <span className="home-stat-visual__tube-fill home-stat-visual__tube-fill--3" />
          </span>
        </div>
      );
    case 'checkups':
      return (
        <div className="home-stat-visual home-stat-visual--checkups" aria-hidden="true">
          <span className="home-stat-visual__document home-stat-visual__document--back" />
          <span className="home-stat-visual__document home-stat-visual__document--front">
            <span className="home-stat-visual__document-line home-stat-visual__document-line--1" />
            <span className="home-stat-visual__document-line home-stat-visual__document-line--2" />
            <span className="home-stat-visual__document-line home-stat-visual__document-line--3" />
            <span className="home-stat-visual__stamp">
              <span className="home-stat-visual__stamp-mark home-stat-visual__stamp-mark--1" />
              <span className="home-stat-visual__stamp-mark home-stat-visual__stamp-mark--2" />
            </span>
          </span>
        </div>
      );
    default:
      return (
        <div className="home-stat-visual home-stat-visual--diagnostics" aria-hidden="true">
          <span className="home-stat-visual__chart-grid" />
          <svg viewBox="0 0 96 64" aria-hidden="true">
            <polyline points="10,44 30,36 48,42 66,22 86,18" />
            <circle cx="10" cy="44" r="3" />
            <circle cx="30" cy="36" r="3" />
            <circle cx="48" cy="42" r="3" />
            <circle cx="66" cy="22" r="3" />
            <circle cx="86" cy="18" r="3" />
          </svg>
        </div>
      );
  }
}

function PromotionPreviewCard({ promotion, onOpen }) {
  const period = formatPromotionPeriod(promotion);

  return (
    <button type="button" className="promotion-preview-card" onClick={() => onOpen(promotion)}>
      <div className="promotion-preview-card__media">
        {promotion.imageUrl ? (
          <img className="promotion-preview-card__image" src={promotion.imageUrl} alt={promotion.title} />
        ) : (
          <div className="promotion-preview-card__image promotion-preview-card__image--placeholder">АКЦИЯ</div>
        )}
      </div>
      <div className="promotion-preview-card__content">
        <h3>{promotion.title}</h3>
        <p>{promotion.shortDescription}</p>
        <div className="promotion-preview-card__footer">
          {period ? <span className="promotion-period">{period}</span> : <span />}
          <span className="promotion-preview-card__link">Открыть акцию</span>
        </div>
      </div>
    </button>
  );
}

export default function Home() {
  const newsViewportRef = useRef(null);
  const [visibleNewsCount, setVisibleNewsCount] = useState(1);
  const [newsStartIndex, setNewsStartIndex] = useState(0);
  const [selectedPromotion, setSelectedPromotion] = useState(null);

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
            <h1>
              <span>Частная медицинская</span>
              <span>клиника «Здоровье»</span>
            </h1>
            <p className="hero-description">
              Удобный сервис, точная диагностика и запись к нужному специалисту без лишних звонков и ожидания.
            </p>

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
              <span className="hero-panel__eyebrow">Удобный сервис</span>
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

      <section className="home-stats-section" aria-label="Ключевые показатели клиники">
        <div className="home-stats-section__head">
          <h2>Интересная статистика за 2025 год по клинике "Здоровье"</h2>
        </div>

        <div className="home-stats">
          {HOME_STATS_ITEMS.map((item) => (
            <article key={item.id} className="home-stat-card">
              <div className="home-stat-card__visual">
                <HomeStatVisual id={item.id} />
              </div>
              <strong>{item.value}</strong>
              <p>{item.label}</p>
            </article>
          ))}
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
              <PromotionPreviewCard key={promotion.id} promotion={promotion} onOpen={setSelectedPromotion} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <h3>Акций пока нет</h3>
            <p>Новые предложения появятся здесь после публикации в админке.</p>
          </div>
        )}
      </section>

      <PromotionDetailsModal promotion={selectedPromotion} onClose={() => setSelectedPromotion(null)} />
    </div>
  );
}
