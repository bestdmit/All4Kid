CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS specialists (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  specialty VARCHAR(100) NOT NULL,
  experience INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0.0,
  location VARCHAR(100) NOT NULL,
  price_per_hour DECIMAL(10,2) DEFAULT 0.0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  category VARCHAR(100) DEFAULT 'Другое',
  FOREIGN KEY (category) REFERENCES categories(name),
  description TEXT DEFAULT '',
  avatar_url VARCHAR(500) DEFAULT ''
);

INSERT INTO categories (name, slug, description, icon_url) VALUES
('Образование', 'education', 'Репетиторы и педагоги', '/icons/education.svg'),
('Профессиональное образование', 'prof-education', 'Профессиональные кружки (IT, моделирование)', '/icons/prof-education.svg'),
('Спорт', 'sports', 'Тренеры и спортивные секции', '/icons/sports.svg'),
('Развлечение', 'entertainment', 'Аниматоры, фокусники, ведущие', '/icons/entertainment.svg'),
('Творчество и искусство', 'creativity', 'Художественные и творческие кружки', '/icons/creativity.svg'),
('Уход', 'care', 'Няни и сиделки', '/icons/care.svg'),
('Другое', 'other', 'Другое', '/icons/other.svg')
ON CONFLICT (name) DO NOTHING;

INSERT INTO specialists (name, specialty, experience, rating, location, price_per_hour) VALUES
('Арина Снежная', 'Преподаватель рисования', 5, 4.5, 'Центральный район', 1000),
('Юлия Холодная ', 'Преподаватель вокала', 7, 4.7, 'Северный район', 2000),
('Мария Иванова', 'Репетитор по математике', 4, 4.3, 'Прибрежный район', 1200),
('Виктория Захарова', 'Аниматор-ведущая', 3, 4.5, 'Западный район', 2000),
('Илья Павлов', 'Фокусник-иллюзионист для детей', 8, 4.9, 'Западный район', 3000),
('Алексей Петров', 'Репетитор по английскому языку для детей', 1, 4.5, 'Заводской район', 1500),
('Алиса Морозова', 'Хореограф для детей', 3, 3.5, 'Прибрежный район', 1500),
('Иван Иванов', 'Тренер по футболу', 10, 4.9, 'Центральный район', 1500)
ON CONFLICT DO NOTHING;

UPDATE specialists SET
  category = CASE
    WHEN specialty = 'Преподаватель рисования' THEN 'Творчество и искусство'
    WHEN specialty = 'Преподаватель вокала' THEN 'Творчество и искусство'
    WHEN specialty = 'Репетитор по математике' THEN 'Образование'
    WHEN specialty = 'Репетитор по английскому языку для детей' THEN 'Образование'
    WHEN specialty = 'Аниматор-ведущая' THEN 'Развлечение'
    WHEN specialty = 'Фокусник-иллюзионист для детей' THEN 'Развлечение'
    WHEN specialty = 'Хореограф для детей' THEN 'Творчество и искусство'
    WHEN specialty = 'Тренер по футболу' THEN 'Спорт'
    ELSE 'Другое'
  END,
  description = CASE
    WHEN specialty = 'Преподаватель рисования' THEN 'Развитие творческого потенциала ребёнка. Обучение рисованию с нуля.'
    WHEN specialty = 'Преподаватель вокала' THEN 'Развитие музыкальных способностей. Индивидуальный подход к каждому ребёнку.'
    WHEN specialty = 'Репетитор по математике' THEN 'Подготовка детей к ОГЭ и ЕГЭ по математике.'
    WHEN specialty = 'Репетитор по английскому языку для детей' THEN 'Инновационная методика преподавания английского языка. Принимаем детей от 6 лет.'
    WHEN specialty = 'Аниматор-ведущая' THEN 'Аниматор для детских праздников любой тематики.'
    WHEN specialty = 'Фокусник-иллюзионист для детей' THEN 'Самые удивительные фокусы для детей любого возраста.'
    WHEN specialty = 'Хореограф для детей' THEN 'Раскрываю грацию, уверенность и любовь к танцу в каждом ребенке!'
    WHEN specialty = 'Тренер по футболу' THEN 'Групповые занятия по футболу.'
    ELSE 'Специалист по работе с детьми'
  END,
  avatar_url = CASE
    WHEN specialty = 'Преподаватель рисования' THEN '/avatars/art-teacher1.jpg'
    WHEN specialty = 'Преподаватель вокала' THEN '/avatars/vocal-teacher1.jpg'
    WHEN specialty = 'Репетитор по математике' THEN '/avatars/math-teacher1.jpg'
    WHEN specialty = 'Репетитор по английскому языку для детей' THEN '/avatars/eng-teacher1.jpg'
    WHEN specialty = 'Аниматор-ведущая' THEN '/avatars/animator1.jpg'
    WHEN specialty = 'Фокусник-иллюзионист для детей' THEN '/avatars/illusionist1.jpg'
    WHEN specialty = 'Хореограф для детей' THEN '/avatars/choreographer1.jpg'
    WHEN specialty = 'Тренер по футболу' THEN '/avatars/trainer1.jpg'
    ELSE '/avatars/default.jpg'
  END;