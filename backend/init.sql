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

ALTER TABLE users
ADD COLUMN IF NOT EXISTS children JSONB DEFAULT '[]';

ALTER TABLE specialists 
ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS certificates JSONB DEFAULT '[]';

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(500) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users (email, password_hash, full_name, phone, role) VALUES
('parent@example.com', '$2b$10$I69n4xm1.cDbbDhjpFMFmuMFQ3A9pMEfSPNECIHEWeWR2nrGT8Lb.', 'Анна Иванова', '+79001234567', 'user'),
('parent2@example.com', '$2b$10$hWDv/GLS8Eyb92LUf052/.y9bNmG7hXJVPullNrOexcGeuLslhBGW', 'Ольга Смирнова', '+79001234568', 'user'),
('admin@example.com', '$2b$10$rXbq58SRC7qx6f35M/LJW.6sZWzk20kn3hfVb9xTTVrrg6NF8X3Rq', 'Администратор', '+79007654321', 'admin'),
('specialist@example.com', '$2a$10$X8zVzLwLpOFpWq5g5h5J3e8TkQ2mZ9X8zVzLwLpOFpWq5g5h5J3e', 'Иван Петров', '+79001112233', 'specialist')
ON CONFLICT (email) DO NOTHING;

UPDATE specialists s
SET user_id = (SELECT id FROM users WHERE email = 'specialist@example.com')
WHERE s.name = 'Иван Петров';

ALTER TABLE specialists 
ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id) ON DELETE CASCADE;

CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  specialist_id INTEGER NOT NULL REFERENCES specialists(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL DEFAULT '',
  is_verified BOOLEAN DEFAULT FALSE,
  is_approved BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (specialist_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_specialist_id ON reviews(specialist_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_approved ON reviews(is_approved);

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

CREATE TABLE IF NOT EXISTS specialist_slots (
  id SERIAL PRIMARY KEY,
  specialist_id INTEGER NOT NULL REFERENCES specialists(id) ON DELETE CASCADE,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  is_booked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (ends_at > starts_at),
  UNIQUE (specialist_id, starts_at, ends_at)
);

CREATE TABLE IF NOT EXISTS appointments (
  id SERIAL PRIMARY KEY,
  specialist_id INTEGER NOT NULL REFERENCES specialists(id) ON DELETE CASCADE,
  parent_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  slot_id INTEGER NOT NULL UNIQUE REFERENCES specialist_slots(id) ON DELETE RESTRICT,
  child_name VARCHAR(255) NOT NULL,
  child_birth_date DATE,
  comment TEXT NOT NULL DEFAULT '',
  status VARCHAR(40) NOT NULL DEFAULT 'pending',
  cancel_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (status IN ('pending', 'confirmed', 'cancelled_by_parent', 'cancelled_by_specialist', 'completed', 'no_show'))
);

CREATE INDEX IF NOT EXISTS idx_specialist_slots_specialist_starts ON specialist_slots(specialist_id, starts_at);
CREATE INDEX IF NOT EXISTS idx_appointments_parent_created ON appointments(parent_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_appointments_specialist_created ON appointments(specialist_id, created_at DESC);

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
