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
('Арина Снежная', 'Преподаватель рисования', 5, 4.5, 'Центральный район', 1000),
('Юлия Холодная ', 'Преподаватель вокала', 7, 4.7, 'Северный район', 2000),
('Мария Иванова', 'Репетитор по математике', 4, 4.3, 'Прибрежный район', 1200),
('Виктория Захарова', 'Аниматор-ведущая', 3, 4.5, 'Западный район', 2000),
('Илья Павлов', 'Фокусник-иллюзионист для детей', 8, 4.9, 'Западный район', 3000),
('Алексей Петров', 'Репетитор по английскому языку для детей', 1, 4.5, 'Заводской район', 1500),
('Алиса Морозова', 'Хореограф для детей', 3, 3.5, 'Прибрежный район', 1500)
ON CONFLICT DO NOTHING;