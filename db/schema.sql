CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY,
  nickname TEXT NOT NULL,
  drink_type TEXT NOT NULL CHECK (drink_type IN ('Classic', 'Signature', 'Custom')),
  category TEXT NOT NULL CHECK (category IN ('IceCream', 'Milkshake')),
  drink_name TEXT NOT NULL,
  selections JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL CHECK (status IN ('Pending', 'Preparing', 'Completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS orders_status_idx ON orders(status);
CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders(created_at DESC);

CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  nickname TEXT NOT NULL,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  answers JSONB NOT NULL,
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS feedback_created_at_idx ON feedback(created_at DESC);

