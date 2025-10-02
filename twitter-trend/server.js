const express = require("express");
const axios = require("axios");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 10000;

const BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN;

const WOEIDS = {
  "Worldwide": 1,
  "Saudi Arabia": 23424938,
  "United Arab Emirates": 23424738,
  "United States": 23424977,
  "Egypt": 23424802,
  "India": 23424848
  // أضف أي دولة أخرى حسب الحاجة
};

app.use(cors());
app.use(express.static("public"));

app.get("/trends/:country", async (req, res) => {
  const country = req.params.country;
  const woeid = WOEIDS[country];
  if(!woeid) return res.status(400).json({ error: "دولة غير مدعومة" });

  try {
    const response = await axios.get(
      `https://api.twitter.com/1.1/trends/place.json?id=${woeid}`,
      { headers: { Authorization: `Bearer ${BEARER_TOKEN}` } }
    );
    const trends = response.data[0].trends.map(t => t.name).slice(0, 10);
    res.json({ trends });
  } catch(err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "تعذر جلب الترندات" });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
