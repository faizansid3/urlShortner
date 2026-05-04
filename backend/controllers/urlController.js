const pool = require('../config/db');
const { client } = require('../config/redis');
const generateShortCode = require('../utils/generateCode');

// 🔗 SHORTEN URL
exports.shortenUrl = async (req, res) => {
  const { original_url } = req.body;

  // ✅ 1. Basic validation
  if (!original_url) {
    return res.status(400).json({ error: 'Original URL is required' });
  }

  // ✅ 2. URL format validation
  try {
    new URL(original_url);
  } catch {
    return res.status(400).json({ error: 'Invalid URL format' });
  }

  try {
    const shortCode = generateShortCode();

    // ✅ 3. Insert (with DB-level uniqueness handling)
    await pool.query(
      'INSERT INTO urls(original_url, short_code) VALUES ($1, $2)',
      [original_url, shortCode]
    );

    return res.json({
      short_url: `http://localhost:5000/${shortCode}`,
    });

  } catch (err) {
    // ✅ 4. Handle duplicate URL (race condition safe)
    if (err.code === '23505') {
      const existing = await pool.query(
        'SELECT short_code FROM urls WHERE original_url = $1',
        [original_url]
      );

      return res.json({
        short_url: `http://localhost:5000/${existing.rows[0].short_code}`,
      });
    }

    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
};


// 🔁 REDIRECT URL (WITH REDIS CACHE)
exports.redirectUrl = async (req, res) => {
  const { code } = req.params;

  try {
    // ✅ 1. Try Redis first
    let cachedUrl;
    try {
      cachedUrl = await client.get(code);
    } catch (err) {
      console.log('⚠️ Redis read failed');
    }

    if (cachedUrl) {
      console.log(`⚡ Cache HIT for ${code}`);
      return res.redirect(cachedUrl);
    }

    console.log(`❌ Cache MISS for ${code}`);

    // ✅ 2. Query DB
    const result = await pool.query(
      'SELECT original_url FROM urls WHERE short_code = $1',
      [code]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'URL not found' });
    }

    const originalUrl = result.rows[0].original_url;

    // ✅ 3. Store in Redis (safe)
    try {
      await client.set(code, originalUrl, {
        EX: 3600, // 1 hour
      });
    } catch (err) {
      console.log('⚠️ Redis write failed');
    }

    // ✅ 4. Redirect
    return res.redirect(originalUrl);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
};