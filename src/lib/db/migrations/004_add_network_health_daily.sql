CREATE TABLE IF NOT EXISTS network_health_daily (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL UNIQUE,
  score INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'offline',
  active_nodes INTEGER NOT NULL DEFAULT 0,
  total_nodes INTEGER NOT NULL DEFAULT 0,
  avg_snr REAL,
  messages_24h INTEGER DEFAULT 0,
  max_hop_count INTEGER DEFAULT 0,
  unique_contributors INTEGER DEFAULT 0,
  geo_spread_km REAL DEFAULT 0,
  score_status INTEGER DEFAULT 0,
  score_signal INTEGER DEFAULT 0,
  score_recency INTEGER DEFAULT 0,
  score_activity INTEGER DEFAULT 0,
  score_reach INTEGER DEFAULT 0,
  score_diversity INTEGER DEFAULT 0,
  score_geo INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_health_daily_date ON network_health_daily(date);
