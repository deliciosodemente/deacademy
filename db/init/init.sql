-- Seed courses
CREATE TABLE
IF NOT EXISTS courses
(
  id serial PRIMARY KEY,
  level text,
  type text,
  title text,
  img text,
  blurb text
);

CREATE TABLE
IF NOT EXISTS threads
(
  id text PRIMARY KEY,
  title text,
  author text,
  time timestamptz
);

INSERT INTO courses
    (level,type,title,img,blurb)
VALUES
    ('Básico', 'General', 'Inglés desde cero', 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?q=80&w=1200&auto=format&fit=crop', 'Fundamentos para empezar con confianza.'),
    ('Intermedio', 'Negocios', 'Inglés de negocios', 'https://images.unsplash.com/photo-1542744094-24638eff58bb?q=80&w=1200&auto=format&fit=crop', 'Reuniones, emails y presentaciones.'),
    ('Avanzado', 'Exámenes', 'Preparación IELTS', 'https://images.unsplash.com/photo-1518081461904-9ac7f44beab6?q=80&w=1200&auto=format&fit=crop', 'Estrategias y práctica intensiva.');

INSERT INTO threads
    (id,title,author,time)
VALUES
    ('t1', '¿Cómo mejorar la pronunciación de la "TH"?', 'Lucía', now() - interval
'2 hour'),
('t2','Recomendaciones para escuchar podcasts','Marco', now
() - interval '1 day');

-- Orders table for payments
CREATE TABLE
IF NOT EXISTS orders
(
  id serial PRIMARY KEY,
  payment_intent_id text UNIQUE,
  amount integer,
  currency text,
  status text,
  customer_email text,
  metadata jsonb,
  created_at timestamptz DEFAULT now
()
);
