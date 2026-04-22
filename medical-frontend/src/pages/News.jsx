import { useQuery } from '@tanstack/react-query';
import { newsApi } from '../api';
import ExpandableNewsCard from '../components/ExpandableNewsCard';

export default function News() {
  const { data: newsItems = [], isLoading } = useQuery({
    queryKey: ['public-news'],
    queryFn: async () => {
      const response = await newsApi.getAll();
      return response.data || [];
    },
  });

  return (
    <div className="news-page">
      <section className="news-page__hero">
        <div>
          <span className="news-page__badge">Новости</span>
          <h1>Все новости клиники</h1>
          <p>Публикуем важные обновления о новых программах, расписании специалистов и сезонных рекомендациях.</p>
        </div>
      </section>

      {isLoading ? (
        <div className="loading">Загрузка новостей...</div>
      ) : newsItems.length === 0 ? (
        <div className="empty-state">
          <h3>Новостей пока нет</h3>
          <p>Опубликованные новости появятся здесь после добавления в админке.</p>
        </div>
      ) : (
        <section className="news-page__grid">
          {newsItems.map((item) => (
            <ExpandableNewsCard key={item.id} item={item} variant="page" />
          ))}
        </section>
      )}

      <style>{`
        .news-page {
          display: grid;
          gap: 24px;
        }

        .news-page__hero {
          padding: 28px;
          border-radius: 28px;
          background:
            radial-gradient(circle at top right, rgba(255, 255, 255, 0.86), transparent 28%),
            linear-gradient(135deg, #fef3ec 0%, #f7f3ff 44%, #eef7ff 100%);
          border: 1px solid rgba(216, 109, 32, 0.12);
          box-shadow: 0 18px 40px rgba(110, 130, 170, 0.1);
        }

        .news-page__badge {
          display: inline-flex;
          align-items: center;
          padding: 8px 14px;
          border-radius: 999px;
          background: rgba(249, 131, 52, 0.12);
          color: #d86d20;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 12px;
        }

        .news-page__hero p {
          margin: 12px 0 0;
          color: #64748b;
          max-width: 760px;
        }

        .news-page__grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 24px;
        }

        @media (max-width: 760px) {
          .news-page__hero {
            padding: 24px 20px;
          }
        }
      `}</style>
    </div>
  );
}
