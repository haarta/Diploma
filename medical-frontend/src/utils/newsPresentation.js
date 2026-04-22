const dateFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const newsPalettes = [
  {
    accent: '#db6f97',
    background: 'linear-gradient(135deg, rgba(246, 214, 224, 1) 0%, rgba(250, 239, 247, 1) 52%, rgba(255, 255, 255, 1) 100%)',
  },
  {
    accent: '#24a4c6',
    background: 'linear-gradient(135deg, rgba(210, 241, 247, 1) 0%, rgba(233, 246, 255, 1) 56%, rgba(255, 255, 255, 1) 100%)',
  },
  {
    accent: '#6f74d8',
    background: 'linear-gradient(135deg, rgba(225, 228, 255, 1) 0%, rgba(239, 239, 255, 1) 58%, rgba(255, 255, 255, 1) 100%)',
  },
  {
    accent: '#2e9b66',
    background: 'linear-gradient(135deg, rgba(219, 245, 229, 1) 0%, rgba(239, 250, 244, 1) 56%, rgba(255, 255, 255, 1) 100%)',
  },
  {
    accent: '#dd7b41',
    background: 'linear-gradient(135deg, rgba(255, 230, 210, 1) 0%, rgba(255, 242, 231, 1) 56%, rgba(255, 255, 255, 1) 100%)',
  },
];

const hashString = (value = '') => {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash);
};

export const formatNewsDate = (value) => {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return dateFormatter.format(date);
};

export const getNewsPresentation = (seedValue) => {
  return newsPalettes[hashString(seedValue) % newsPalettes.length];
};

export const getNewsFallbackLabel = (item) => {
  const source = item?.category || item?.title || 'NEWS';
  const [firstWord = 'NEWS'] = source.trim().split(/\s+/);
  return firstWord.slice(0, 8).toUpperCase();
};
