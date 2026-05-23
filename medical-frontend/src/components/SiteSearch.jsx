import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  doctorsApi,
  newsApi,
  onlineConsultationsApi,
  promotionsApi,
} from '../api';
import { buildSections, normalize } from '../data/servicesCatalog';

const MIN_QUERY_LENGTH = 2;
const MAX_ITEMS_PER_GROUP = 3;
const GROUP_TITLES = {
  doctor: 'Врачи',
  service: 'Услуги',
  news: 'Новости',
  promotion: 'Акции',
  consultation: 'Онлайн-консультации',
};
const GROUP_ORDER = ['doctor', 'service', 'promotion', 'news', 'consultation'];

const buildSearchText = (...parts) => normalize(parts.filter(Boolean).join(' '));

const getSettledData = (result) => (result.status === 'fulfilled' ? result.value?.data || [] : []);

const scoreMatch = (item, query) => {
  let score = 0;

  if (item.titleNormalized.startsWith(query)) {
    score += 120;
  } else if (item.titleNormalized.includes(query)) {
    score += 90;
  }

  if (item.subtitleNormalized.startsWith(query)) {
    score += 70;
  } else if (item.subtitleNormalized.includes(query)) {
    score += 50;
  }

  if (item.searchText.includes(query)) {
    score += 30;
  }

  if (item.words.some((word) => word.startsWith(query))) {
    score += 25;
  }

  return score;
};

async function loadSearchIndex() {
  const [doctorsResult, newsResult, promotionsResult, consultationsResult] = await Promise.allSettled([
    doctorsApi.getAll(),
    newsApi.getAll(),
    promotionsApi.getAll(),
    onlineConsultationsApi.getAll(),
  ]);

  const doctors = getSettledData(doctorsResult);
  const newsItems = getSettledData(newsResult);
  const promotions = getSettledData(promotionsResult);
  const consultations = getSettledData(consultationsResult);
  const serviceSections = buildSections(doctors);

  return [
    ...doctors.map((doctor) => {
      const title = doctor.fullName || 'Врач';
      const subtitle = doctor.specialty || 'Без специализации';
      const searchText = buildSearchText(
        doctor.fullName,
        doctor.specialty,
        doctor.branch,
        doctor.description,
      );

      return {
        id: `doctor-${doctor.id}`,
        type: 'doctor',
        title,
        subtitle,
        description: doctor.branch || 'Переход к записи на прием',
        href: `/appointments?doctorId=${doctor.id}`,
        titleNormalized: normalize(title),
        subtitleNormalized: normalize(subtitle),
        searchText,
        words: searchText.split(/\s+/).filter(Boolean),
      };
    }),
    ...serviceSections.flatMap((section) =>
      section.items.map((item) => {
        const title = item.title;
        const subtitle = section.title;
        const serviceNames = item.services.map((service) => service.name).join(' ');
        const searchText = buildSearchText(
          section.title,
          item.title,
          item.summary,
          item.description,
          item.highlights.join(' '),
          serviceNames,
        );

        return {
          id: `service-${section.id}-${item.id}`,
          type: 'service',
          title,
          subtitle,
          description: item.summary,
          href: `/services?section=${section.id}&category=${item.id}`,
          titleNormalized: normalize(title),
          subtitleNormalized: normalize(subtitle),
          searchText,
          words: searchText.split(/\s+/).filter(Boolean),
        };
      })
    ),
    ...promotions.map((item) => {
      const title = item.title || 'Акция';
      const subtitle = 'Акции';
      const searchText = buildSearchText(item.title, item.shortDescription, item.description);

      return {
        id: `promotion-${item.id}`,
        type: 'promotion',
        title,
        subtitle,
        description: item.shortDescription || 'Переход к списку акций',
        href: '/promotions',
        titleNormalized: normalize(title),
        subtitleNormalized: normalize(subtitle),
        searchText,
        words: searchText.split(/\s+/).filter(Boolean),
      };
    }),
    ...newsItems.map((item) => {
      const title = item.title || 'Новость';
      const subtitle = 'Новости';
      const searchText = buildSearchText(item.title, item.shortDescription, item.description);

      return {
        id: `news-${item.id}`,
        type: 'news',
        title,
        subtitle,
        description: item.shortDescription || 'Переход к списку новостей',
        href: '/news',
        titleNormalized: normalize(title),
        subtitleNormalized: normalize(subtitle),
        searchText,
        words: searchText.split(/\s+/).filter(Boolean),
      };
    }),
    ...consultations.map((item) => {
      const title = item.title || 'Онлайн-консультация';
      const subtitle = 'Онлайн-консультации';
      const searchText = buildSearchText(item.title, item.shortDescription, item.description);

      return {
        id: `consultation-${item.id}`,
        type: 'consultation',
        title,
        subtitle,
        description: item.shortDescription || 'Переход к онлайн-консультациям',
        href: '/online-consultations',
        titleNormalized: normalize(title),
        subtitleNormalized: normalize(subtitle),
        searchText,
        words: searchText.split(/\s+/).filter(Boolean),
      };
    }),
  ];
}

export default function SiteSearch() {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const normalizedQuery = useMemo(() => normalize(query), [query]);

  const suggestions = useMemo(() => {
    if (normalizedQuery.length < MIN_QUERY_LENGTH) {
      return [];
    }

    return index
      .map((item) => ({
        ...item,
        score: scoreMatch(item, normalizedQuery),
      }))
      .filter((item) => item.score > 0)
      .sort(
        (left, right) =>
          right.score - left.score || left.title.localeCompare(right.title, 'ru'),
      )
      .slice(0, 8);
  }, [index, normalizedQuery]);

  const groupedSuggestions = useMemo(
    () =>
      GROUP_ORDER.map((group) => ({
        key: group,
        title: GROUP_TITLES[group],
        items: suggestions.filter((item) => item.type === group).slice(0, MAX_ITEMS_PER_GROUP),
      })).filter((group) => group.items.length > 0),
    [suggestions]
  );

  const flatSuggestions = useMemo(
    () => groupedSuggestions.flatMap((group) => group.items),
    [groupedSuggestions]
  );

  useEffect(() => {
    if (flatSuggestions.length === 0) {
      setActiveIndex(-1);
      return;
    }

    setActiveIndex((current) => {
      if (current < 0) {
        return 0;
      }
      return Math.min(current, flatSuggestions.length - 1);
    });
  }, [flatSuggestions]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const ensureIndexLoaded = async () => {
    if (hasLoaded || isLoading) {
      return;
    }

    setIsLoading(true);
    try {
      const nextIndex = await loadSearchIndex();
      setIndex(nextIndex);
      setHasLoaded(true);
    } finally {
      setIsLoading(false);
    }
  };

  const openSuggestions = async () => {
    setIsOpen(true);
    await ensureIndexLoaded();
  };

  const closeSuggestions = () => {
    setIsOpen(false);
    setActiveIndex(-1);
  };

  const selectSuggestion = (item) => {
    setQuery('');
    closeSuggestions();
    navigate(item.href);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await ensureIndexLoaded();

    const selected = flatSuggestions[activeIndex] || flatSuggestions[0];
    if (selected) {
      selectSuggestion(selected);
      return;
    }

    const fallbackQuery = query.trim();
    if (fallbackQuery) {
      closeSuggestions();
      navigate(`/doctors?search=${encodeURIComponent(fallbackQuery)}`);
    }
  };

  const handleKeyDown = (event) => {
    if (!flatSuggestions.length) {
      if (event.key === 'Escape') {
        closeSuggestions();
      }
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((current) => (current + 1) % flatSuggestions.length);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((current) =>
        current <= 0 ? flatSuggestions.length - 1 : current - 1
      );
      return;
    }

    if (event.key === 'Escape') {
      closeSuggestions();
    }
  };

  const shouldShowDropdown =
    isOpen && (normalizedQuery.length >= MIN_QUERY_LENGTH || isLoading);

  return (
    <form className="search-form site-search" onSubmit={handleSubmit} ref={containerRef}>
      <input
        className="search-input"
        type="search"
        placeholder="Поиск по врачам, услугам и материалам"
        value={query}
        onFocus={() => {
          void openSuggestions();
        }}
        onChange={(event) => {
          setQuery(event.target.value);
          setIsOpen(true);
          void ensureIndexLoaded();
        }}
        onKeyDown={handleKeyDown}
        autoComplete="off"
        aria-label="Поиск по системе"
      />

      {shouldShowDropdown ? (
        <div className="site-search-dropdown">
          {isLoading ? (
            <div className="site-search-status">Загрузка подсказок...</div>
          ) : groupedSuggestions.length > 0 ? (
            groupedSuggestions.map((group) => (
              <div key={group.key} className="site-search-group">
                <div className="site-search-group__title">{group.title}</div>
                <div className="site-search-group__list">
                  {group.items.map((item) => {
                    const currentIndex = flatSuggestions.findIndex((entry) => entry.id === item.id);

                    return (
                      <button
                        key={item.id}
                        type="button"
                        className={`site-search-item${currentIndex === activeIndex ? ' site-search-item--active' : ''}`}
                        onMouseEnter={() => setActiveIndex(currentIndex)}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => selectSuggestion(item)}
                      >
                        <span className="site-search-item__title">{item.title}</span>
                        <span className="site-search-item__subtitle">{item.subtitle}</span>
                        <span className="site-search-item__description">{item.description}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            <div className="site-search-status">
              По запросу ничего не найдено. Попробуйте уточнить формулировку.
            </div>
          )}
        </div>
      ) : null}
    </form>
  );
}
