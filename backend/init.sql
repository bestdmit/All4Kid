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
  avatar_url VARCHAR(500) DEFAULT '/uploads/avatars/default.jpg'
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
    WHEN specialty = 'Преподаватель рисования' THEN '/uploads/avatars/default.jpg'
    WHEN specialty = 'Преподаватель вокала' THEN '/uploads/avatars/default.jpg'
    WHEN specialty = 'Репетитор по математике' THEN '/uploads/avatars/default.jpg'
    WHEN specialty = 'Репетитор по английскому языку для детей' THEN '/uploads/avatars/default.jpg'
    WHEN specialty = 'Аниматор-ведущая' THEN '/uploads/avatars/default.jpg'
    WHEN specialty = 'Фокусник-иллюзионист для детей' THEN '/uploads/avatars/default.jpg'
    WHEN specialty = 'Хореограф для детей' THEN '/uploads/avatars/default.jpg'
    WHEN specialty = 'Тренер по футболу' THEN '/uploads/avatars/default.jpg'
    ELSE '/uploads/avatars/default.jpg'
  END;

  -- Создаем таблицу пользователей (родителей)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  avatar_url VARCHAR(500) DEFAULT '/uploads/avatars/default.jpg',
  role VARCHAR(50) DEFAULT 'user', -- 'user', 'admin', 'specialist'
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Обновляем таблицу специалистов, связываем с пользователями
ALTER TABLE specialists 
ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS certificates JSONB DEFAULT '[]';

-- Таблица для хранения refresh токенов
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(500) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Добавляем тестовых пользователей
INSERT INTO users (email, password_hash, full_name, phone, role) VALUES
('parent@example.com', '$2b$10$HvApX8AdKYAXoYNlV6SWlOuhHGckOiEZrFHFx1nP3yd298bhieq0O', 'Анна Иванова', '+79001234567', 'user'),
('admin@example.com', '$2b$10$x8hRXl/35bWZBb/pZCWo.u5/HKTIUF35V7nr0GTyD0HPqdxpB5pqS', 'Администратор', '+79007654321', 'admin'),
('specialist@example.com', '$2b$10$l6ixMIso0JM1JijftqKZn.MpKJPXjqkHiDIX9/M2x8QTdbk.0TtB2', 'Иван Петров', '+79001112233', 'specialist')
ON CONFLICT (email) DO NOTHING;

-- Обновляем существующих специалистов, привязываем к пользователю
UPDATE specialists s
SET user_id = (SELECT id FROM users WHERE email = 'specialist@example.com')
WHERE s.name = 'Иван Петров';

ALTER TABLE specialists 
ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id) ON DELETE CASCADE;

-- Таблица отзывов
CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  specialist_id INTEGER NOT NULL REFERENCES specialists(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  is_approved BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (specialist_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_specialist_id ON reviews(specialist_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);

-- Функция пересчета рейтинга специалиста по подтвержденным отзывам
CREATE OR REPLACE FUNCTION refresh_specialist_rating_from_reviews()
RETURNS TRIGGER AS $$
DECLARE
  target_specialist_id INTEGER;
BEGIN
  target_specialist_id := COALESCE(NEW.specialist_id, OLD.specialist_id);

  UPDATE specialists
  SET rating = COALESCE((
    SELECT ROUND(AVG(r.rating)::numeric, 2)
    FROM reviews r
    WHERE r.specialist_id = target_specialist_id
      AND r.is_approved = TRUE
  ), 0)
  WHERE id = target_specialist_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_refresh_specialist_rating_on_reviews ON reviews;

CREATE TRIGGER trg_refresh_specialist_rating_on_reviews
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW
EXECUTE FUNCTION refresh_specialist_rating_from_reviews();

-- Тестовые отзывы
INSERT INTO reviews (specialist_id, user_id, rating, comment, is_verified, is_approved)
SELECT 1, u.id, 5, 'Готовились к ОГЭ всего 3 месяца, результат превзошел ожидания.', TRUE, TRUE
FROM users u
WHERE u.email = 'parent@example.com'
ON CONFLICT (specialist_id, user_id) DO NOTHING;

INSERT INTO reviews (specialist_id, user_id, rating, comment, is_verified, is_approved)
SELECT 1, u.id, 4, 'Занимаемся уже год. Профессионал своего дела, ребенку очень нравится.', TRUE, TRUE
FROM users u
WHERE u.email = 'admin@example.com'
ON CONFLICT (specialist_id, user_id) DO NOTHING;