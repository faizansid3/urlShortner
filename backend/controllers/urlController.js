const pool = require('../config/db');
const generateShortCode = require('../utils/generateCode');

exports.shortenUrl= async(req,res)=>{
    const {original_url} = req.body;

    try{
        const shortCode= generateShortCode();
        await pool.query(
            'INSERT INTO urls(original_url, short_code) VALUES ($1, $2)',
            [original_url, shortCode]
        );
        res.json({
            short_url: `http://localhost:5000/${shortCode}`,
        });
    }
    catch(err){
        console.error(err);
        res.status(500).json({error: 'Server error'});
    }
};

exports.redirectUrl = async (req, res) => {
  const { code } = req.params;

  try {
    const result = await pool.query(
      'SELECT original_url FROM urls WHERE short_code = $1',
      [code]
    );

    if (result.rows.length > 0) {
      return res.redirect(result.rows[0].original_url);
    }

    res.status(404).json({ error: 'URL not found' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};