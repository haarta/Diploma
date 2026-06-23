import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { doctorsApi } from '../api';
import '../styles/DoctorsCatalog.css';

const INITIAL_FILTERS = {
  search: '',
  specialty: 'all',
};

const UNKNOWN_SPECIALTY = 'Без специализации';

function getAverageRating(reviews) {
  if (!reviews?.length) return null;
  const sum = reviews.reduce((acc, item) => acc + Number(item.rating || 0), 0);
  return (sum / reviews.length).toFixed(1);
}

export default function Doctors() {
  const [searchParams] = useSearchParams();
  const [expandedDoctorId, setExpandedDoctorId] = useState(null);
  const [filters, setFilters] = useState({
    ...INITIAL_FILTERS,
    search: searchParams.get('search') || '',
  });

  const { data: doctors = [], isLoading } = useQuery({
    queryKey: ['public-doctors'],
    queryFn: async () => {
      const response = await doctorsApi.getAll();
      return response.data || [];
    },
  });

  const specialties = useMemo(() => {
    const values = doctors
      .map((doctor) => (doctor.specialty || '').trim())
      .filter(Boolean);

    return [...new Set(values)].sort((a, b) => a.localeCompare(b, 'ru'));
  }, [doctors]);

  const filteredDoctors = useMemo(() => {
    const query = filters.search.trim().toLowerCase();

    return doctors.filter((doctor) => {
      const fullName = (doctor.fullName || '').toLowerCase();
      const specialty = (doctor.specialty || '').toLowerCase();
      const branch = (doctor.branch || '').toLowerCase();

      const matchesSearch =
        !query || fullName.includes(query) || specialty.includes(query) || branch.includes(query);
      const matchesSpecialty = filters.specialty === 'all' || doctor.specialty === filters.specialty;

      return matchesSearch && matchesSpecialty;
    });
  }, [doctors, filters]);

  const groupedDoctors = useMemo(() => {
    const groupsMap = filteredDoctors.reduce((acc, doctor) => {
      const specialty = (doctor.specialty || '').trim() || UNKNOWN_SPECIALTY;
      if (!acc.has(specialty)) {
        acc.set(specialty, []);
      }
      acc.get(specialty).push(doctor);
      return acc;
    }, new Map());

    return [...groupsMap.entries()]
      .sort((a, b) => a[0].localeCompare(b[0], 'ru'))
      .map(([specialty, items]) => ({ specialty, items }));
  }, [filteredDoctors]);

  const totalReviews = useMemo(
    () => filteredDoctors.reduce((total, doctor) => total + (doctor.reviews?.length || 0), 0),
    [filteredDoctors]
  );

  useEffect(() => {
    const nextSearch = searchParams.get('search') || '';

    setFilters((prev) => {
      if (prev.search === nextSearch) {
        return prev;
      }

      return {
        ...prev,
        search: nextSearch,
        specialty: 'all',
      };
    });
  }, [searchParams]);

  const toggleReviews = (doctorId) => {
    setExpandedDoctorId((current) => (current === doctorId ? null : doctorId));
  };

  if (isLoading) {
    return <div className="loading">Загрузка врачей...</div>;
  }

  return (
    <section className="doctors-catalog">
      <section className="doctors-hero">
        <div>
          <span className="doctors-hero__badge">Врачи клиники</span>
          <h1>Найдите нужного врача за пару кликов</h1>
          <p>
            Фильтруйте каталог по направлению и быстро переходите к записи на прием.
          </p>
        </div>

        <div className="doctors-hero__stats" aria-label="Статистика каталога">
          <div>
            <strong>{filteredDoctors.length}</strong>
            <span>специалистов доступно</span>
          </div>
          <div>
            <strong>{specialties.length}</strong>
            <span>направлений в каталоге</span>
          </div>
          <div>
            <strong>{totalReviews}</strong>
            <span>отзывов от пациентов</span>
          </div>
        </div>
      </section>

      <div className="doctors-filters">
        <input
          className="doctors-search"
          type="search"
          placeholder="Найти специалиста"
          value={filters.search}
          onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
        />

        <select
          className="doctors-select"
          value={filters.specialty}
          onChange={(event) => setFilters((prev) => ({ ...prev, specialty: event.target.value }))}
        >
          <option value="all">Все специализации</option>
          {specialties.map((specialty) => (
            <option key={specialty} value={specialty}>
              {specialty}
            </option>
          ))}
        </select>

        <button type="button" className="doctors-reset" onClick={() => setFilters(INITIAL_FILTERS)}>
          Сбросить фильтр
        </button>
      </div>

      {groupedDoctors.length === 0 ? (
        <div className="empty-state">
          <h3>Ничего не найдено</h3>
          <p>Попробуйте изменить параметры поиска.</p>
        </div>
      ) : (
        groupedDoctors.map((group) => (
          <div key={group.specialty} className="doctors-group">
            <h2 className="doctors-section-title">{group.specialty}</h2>
            <div className="doctors-grid">
              {group.items.map((doctor) => {
                const reviewsCount = doctor.reviews?.length || 0;
                const rating = getAverageRating(doctor.reviews);
                const isReviewsOpen = expandedDoctorId === doctor.id;

                return (
                  <article
                    key={doctor.id}
                    className={`doctor-card-catalog${isReviewsOpen ? ' doctor-card-catalog--expanded' : ''}`}
                  >
                    <div className="doctor-card-shell">
                      <div className="doctor-card-content">
                        <div className="doctor-meta-top">
                          <span className="doctor-rating-text">{rating ? `★ ${rating}` : '★'}</span>
                          {reviewsCount > 0 ? (
                            <button
                              type="button"
                              className="doctor-reviews-toggle"
                              onClick={() => toggleReviews(doctor.id)}
                            >
                              {isReviewsOpen ? 'Свернуть отзывы' : `Отзывы (${reviewsCount})`}
                            </button>
                          ) : (
                            <span className="doctor-reviews-link">Отзывов пока нет</span>
                          )}
                        </div>

                        <h3 className="doctor-name">{doctor.fullName}</h3>
                        <p className="doctor-specialty">{doctor.specialty || UNKNOWN_SPECIALTY}</p>

                        <div className="doctor-meta-list">
                          <p>
                            <strong>Стаж:</strong> {doctor.experienceYears ?? 'не указан'} лет
                          </p>
                        </div>

                        {doctor.description ? <p className="doctor-description">{doctor.description}</p> : null}

                        <div className="doctor-card-actions">
                          <Link className="doctor-appointment-btn" to={`/appointments?doctorId=${doctor.id}`}>
                            Записаться на прием
                          </Link>
                        </div>
                      </div>

                      <div className="doctor-photo-wrap">
                        {doctor.photoUrl ? (
                          <img src={doctor.photoUrl} alt={doctor.fullName} className="doctor-photo" loading="lazy" />
                        ) : (
                          <div className="doctor-photo-placeholder">Фото</div>
                        )}
                      </div>
                    </div>

                    {isReviewsOpen ? (
                      <section className="doctor-reviews-expanded">
                        <div className="doctor-reviews-expanded__head">
                          <div>
                            <h4>Отзывы о враче</h4>
                            <p>Реальные отклики пациентов по завершенным приемам.</p>
                          </div>
                          <span className="doctor-reviews-expanded__count">{reviewsCount}</span>
                        </div>

                        <div className="doctor-reviews-scroller">
                          {doctor.reviews.map((review) => (
                            <article key={review.id} className="doctor-review-card">
                              <div className="doctor-review-card__meta">
                                <strong>{review.authorName}</strong>
                                <span>{`★ ${review.rating}`}</span>
                              </div>
                              <p>{review.text}</p>
                            </article>
                          ))}
                        </div>
                      </section>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </div>
        ))
      )}
    </section>
  );
}
