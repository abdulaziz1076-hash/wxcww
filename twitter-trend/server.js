// server.js
const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.static("public"));

// قائمة الدول المدعومة في trends24
const supportedCountries = ["united-states", "saudi-arabia", "uae", "egypt", "uk"];

app.get("/trends/:country", async (req, res) => {
  const country = req.params.country.toLowerCase();

  if (!supportedCountries.includes(country)) {
    return res.json({ error: "دولة غير مدعومة" });
  }

  const url = `https://trends24.in/${country}/`;

  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    const trends = [];

    $("ol.trending-list li a").each((i, el) => {
      trends.push($(el).text().trim());
    });

    res.json(trends);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "حدث خطأ في السيرفر" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
