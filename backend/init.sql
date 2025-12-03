CREATE TABLE IF NOT EXISTS specialists (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  specialty VARCHAR(100) NOT NULL,
  experience INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0.0,
  location VARCHAR(100) NOT NULL,
  price_per_hour DECIMAL(10,2) DEFAULT 0.0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO specialists (name, specialty, experience, rating, location, price_per_hour) VALUES
('Арина Снежная', 'Педиатр', 5, 4.8, 'Центральный район', 2000),
('Юля Холодная ', 'Логопед', 8, 4.9, 'Северный район', 1800),
('Олеся Морозова', 'Тренер по плаванию', 3, 4.5, 'Западный район', 1500),
('Валентина Южная', 'Массажист', 4, 4.5, 'Западный район', 2500),
('Алексей Попов', 'Логопед', 7, 4.6, 'Западный район', 1500),
('Николай Север', 'Тренер по шахматам', 10, 4.9, 'Центральный район', 1500),
('Юрий Теплый', 'Тренер по боксу', 7, 4.6, 'Северный район', 2500),
('Михаил Перминов', 'Тренер по футболу', 15, 4.9, 'Западный район', 3000),
('Владислав Мирный', 'Тренер по баскетболу', 9, 3.7, 'Восточный район', 500),
('Глеб Голубин', 'Тренер по футболу', 10, 5.0, 'Центральный район', 3000),
('Василий Забивной', 'Тренер по волейболу', 7, 4.6, 'Западный район', 2000),
('Михаил Старший', 'Тренер по боксу', 1, 4.0, 'Западный район', 1000),
('Алексей Воронин', 'Тренер по шахматам', 10, 5.0, 'Восточный район', 3500),
('Леонид Воронин', 'Тренер по боксу', 10, 4.1, 'Центральный район', 1500),
('Юрий Младший', 'Тренер по волейболу', 4, 4.8, 'Северный район', 2000),
('Владимир Морозов', 'Тренер по волейболу', 7, 4.6, 'Западный район', 2100),
('Яна Соленая', 'Тренер по баскетболу', 1, 4.0, 'Западный район', 1000),
('Максим Сладкий', 'Тренер по шахматам', 7, 5.0, 'Восточный район', 3100),
('Юрий Иванов', 'Тренер по боксу', 11, 4.1, 'Центральный район', 1600),
('Артем Петров', 'Тренер по баскетболу', 2, 4.8, 'Северный район', 2200),
('Владимир Лупин', 'Тренер по футболу', 4, 4.6, 'Южный район', 1100),
('Артем Иванов', 'Тренер по футболу', 9, 4.7, 'Западный район', 2000),
('Максим Гагарин', 'Тренер по шахматам', 11, 4.5, 'Восточный район', 3300),
('Юрий Передний', 'Тренер по волейболу', 4, 4.9, 'Центральный район', 1900),
('Артем Север', 'Тренер по баскетболу', 2, 4.8, 'Северный район', 2100),
('Владимир Смирнов', 'Тренер по футболу', 7, 4.9, 'Южный район', 1200),
('Артем Кузнецов', 'Тренер по футболу', 11, 4.7, 'Западный район', 2200),
('Максим Попов', 'Тренер по шахматам', 4, 4.5, 'Восточный район', 3100),
('Юрий Васильев', 'Тренер по волейболу', 13, 4.4, 'Центральный район', 1700),
('Артем Федоров', 'Тренер по баскетболу', 5, 4.6, 'Северный район', 2400)
ON CONFLICT DO NOTHING;


ALTER TABLE specialists
ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'Другое',
ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500) DEFAULT '';

CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  icon_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO categories (name, slug, description, icon_url) VALUES
('Врачи', 'doctors', 'Медицинские специалисты для детей', '/icons/doctor.svg'),
('Образование', 'education', 'Репетиторы и педагоги', '/icons/education.svg'),
('Спорт', 'sports', 'Тренеры и спортивные секции', '/icons/sports.svg'),
('Развитие', 'development', 'Психологи и логопеды', '/icons/development.svg'),
('Творчество', 'creativity', 'Художественные и творческие кружки', '/icons/creativity.svg'),
('Уход', 'care', 'Няни и сиделки', '/icons/care.svg')
ON CONFLICT (name) DO NOTHING;

UPDATE specialists SET 
  category = CASE 
    WHEN specialty = 'Педиатр' THEN 'Врачи'
    WHEN specialty = 'Логопед' THEN 'Развитие' 
    WHEN specialty = 'Психолог' THEN 'Развитие'
    WHEN specialty = 'Тренер по плаванию' THEN 'Спорт'
    WHEN specialty = 'Тренер по шахматам' THEN 'Спорт'
    WHEN specialty = 'Тренер по боксу' THEN 'Спорт'
    WHEN specialty = 'Тренер по футболу' THEN 'Спорт'
    WHEN specialty = 'Тренер по баскетболу' THEN 'Спорт'
    WHEN specialty = 'Тренер по волейболу' THEN 'Спорт'
    WHEN specialty = 'Массажист' THEN 'Врачи'
    ELSE 'Другое'
  END,
  description = CASE
    WHEN specialty = 'Педиатр' THEN 'Консультации, лечение заболеваний, профилактические осмотры'
    WHEN specialty = 'Логопед' THEN 'Коррекция речи, постановка звуков, развитие речи'
    WHEN specialty = 'Психолог' THEN 'Детская психология, помощь в адаптации, консультации для родителей'
    WHEN specialty = 'Тренер по плаванию' THEN 'Индивидуальные и групповые занятия по плаванию для детей'
    WHEN specialty = 'Тренер по шахматам' THEN 'Индивидуальные и групповые занятия по шахматам для детей'
    WHEN specialty = 'Тренер по боксу' THEN 'Индивидуальные и групповые занятия по боксу для детей'
    WHEN specialty = 'Тренер по футболу' THEN 'Индивидуальные и групповые занятия по футболу для детей'
    WHEN specialty = 'Тренер по баскетболу' THEN 'Индивидуальные и групповые занятия по баскетболу для детей'
    WHEN specialty = 'Тренер по волейболу' THEN 'Индивидуальные и групповые занятия по волейболу для детей'
    WHEN specialty = 'Массажист' THEN 'Лечебный и профилактический массаж для детей'
    ELSE 'Специалист по работе с детьми'
  END,
  avatar_url = CASE
    WHEN specialty = 'Педиатр' THEN '/avatars/doctor1.jpg'
    WHEN specialty = 'Логопед' THEN '/avatars/teacher1.jpg'
    WHEN specialty = 'Психолог' THEN '/avatars/psychologist1.jpg'
    WHEN specialty = 'Тренер по плаванию' THEN '/avatars/trainer1.jpg'
    WHEN specialty = 'Тренер по шахматам' THEN '/avatars/trainer2.jpg'
    WHEN specialty = 'Тренер по боксу' THEN '/avatars/trainer3.jpg'
    WHEN specialty = 'Тренер по футболу' THEN '/avatars/trainer4.jpg'
    WHEN specialty = 'Тренер по баскетболу' THEN '/avatars/trainer5.jpg'
    WHEN specialty = 'Тренер по волейболу' THEN '/avatars/trainer6.jpg'
    WHEN specialty = 'Массажист' THEN '/avatars/masseur1.jpg'
    ELSE '/avatars/default.jpg'
  END;

  -- Создаем таблицу пользователей (родителей)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  avatar_url VARCHAR(500) DEFAULT '/avatars/default-user.jpg',
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
('parent@example.com', '$2a$10$X8zVzLwLpOFpWq5g5h5J3e8TkQ2mZ9X8zVzLwLpOFpWq5g5h5J3e', 'Анна Иванова', '+79001234567', 'user'),
('admin@example.com', '$2a$10$X8zVzLwLpOFpWq5g5h5J3e8TkQ2mZ9X8zVzLwLpOFpWq5g5h5J3e', 'Администратор', '+79007654321', 'admin'),
('specialist@example.com', '$2a$10$X8zVzLwLpOFpWq5g5h5J3e8TkQ2mZ9X8zVzLwLpOFpWq5g5h5J3e', 'Иван Петров', '+79001112233', 'specialist')
ON CONFLICT (email) DO NOTHING;

-- Обновляем существующих специалистов, привязываем к пользователю
UPDATE specialists s
SET user_id = (SELECT id FROM users WHERE email = 'specialist@example.com')
WHERE s.name = 'Иван Петров';