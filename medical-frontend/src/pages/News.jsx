import { useQuery } from '@tanstack/react-query';
import { newsApi } from '../api';
import ExpandableNewsCard from '../components/ExpandableNewsCard';
import '../styles/NewsPage.css';

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
    </div>
  );
}
