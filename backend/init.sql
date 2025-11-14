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