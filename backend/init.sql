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
('Олеся Морозова', 'Тренер по плаванию', 3, 4.5, 'Западный район', 1500)
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
    WHEN specialty = 'Массажист' THEN 'Врачи'
    ELSE 'Другое'
  END,
  description = CASE
    WHEN specialty = 'Педиатр' THEN 'Консультации, лечение заболеваний, профилактические осмотры'
    WHEN specialty = 'Логопед' THEN 'Коррекция речи, постановка звуков, развитие речи'
    WHEN specialty = 'Психолог' THEN 'Детская психология, помощь в адаптации, консультации для родителей'
    WHEN specialty = 'Тренер по плаванию' THEN 'Индивидуальные и групповые занятия по плаванию для детей'
    WHEN specialty = 'Массажист' THEN 'Лечебный и профилактический массаж для детей'
    ELSE 'Специалист по работе с детьми'
  END,
  avatar_url = CASE
    WHEN specialty = 'Педиатр' THEN '/avatars/doctor1.jpg'
    WHEN specialty = 'Логопед' THEN '/avatars/teacher1.jpg'
    WHEN specialty = 'Психолог' THEN '/avatars/psychologist1.jpg'
    WHEN specialty = 'Тренер по плаванию' THEN '/avatars/trainer1.jpg'
    WHEN specialty = 'Массажист' THEN '/avatars/masseur1.jpg'
    ELSE '/avatars/default.jpg'
  END;