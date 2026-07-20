export default {
  version: 4,
  name: "api-key-usage-reservations",
  up(db) {
    db.exec(`CREATE TABLE IF NOT EXISTS apiKeyUsageReservations (
      id TEXT PRIMARY KEY,
      apiKeyId TEXT NOT NULL,
      reservedTokens INTEGER NOT NULL,
      createdAt TEXT NOT NULL,
      expiresAt TEXT NOT NULL
    )`);
    db.exec("CREATE INDEX IF NOT EXISTS idx_akur_key_expiry ON apiKeyUsageReservations(apiKeyId, expiresAt)");
    db.exec("CREATE INDEX IF NOT EXISTS idx_uh_api_key_ts ON usageHistory(apiKey, timestamp)");
  },
};
