const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.static("public"));

app.get("/trends/:country", async (req, res) => {
  const country = req.params.country;
  const url = `https://trends24.in/${country}/`;

  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);

    let trends = [];
    $("ol.trending-list li").each((i, el) => {
      if (i < 10) {
        const trend = $(el).text().trim();
        trends.push(trend);
      }
    });

    res.json({ trends });
  } catch (error) {
    res.status(500).json({ error: "لا يمكن جلب الترندات" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
