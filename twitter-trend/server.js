const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.static("public"));

const COUNTRY_CODES = {
  "Worldwide": "worldwide",
  "Saudi Arabia": "saudi-arabia",
  "United Arab Emirates": "united-arab-emirates",
  "United States": "united-states",
  "Egypt": "egypt",
  "India": "india"
};

app.get("/trends/:country", async (req, res) => {
  const country = req.params.country;
  const code = COUNTRY_CODES[country];
  if(!code) return res.status(400).json({ error: "دولة غير مدعومة" });

  try {
    const url = `https://trends24.in/${code}/`;
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    const trends = [];
    $(".trend-card .trend-name").each((i, el) => {
      if(i>=10) return false; // أول 10 ترندات
      trends.push({
        name: $(el).text(),
        link: $(el).attr("href")
      });
    });
    res.json({ trends });
  } catch(err) {
    console.error(err.message);
    res.status(500).json({ error: "فشل في جلب الترند" });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
