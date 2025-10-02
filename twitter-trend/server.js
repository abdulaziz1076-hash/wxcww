// server.js
const express = require("express");
const cors = require("cors");
const path = require("path");
const puppeteer = require("puppeteer");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

// خريطة الأسماء التي سيقبلها الواجهة إلى slugs في trends24
const COUNTRY_SLUGS = {
  "Worldwide": "worldwide",
  "Saudi Arabia": "saudi-arabia",
  "United Arab Emirates": "united-arab-emirates",
  "United States": "united-states",
  "Egypt": "egypt",
  "India": "india",
  "Kuwait": "kuwait",
  "Qatar": "qatar",
  "Bahrain": "bahrain",
  "Oman": "oman",
  "Jordan": "jordan",
  "Lebanon": "lebanon",
  "Turkey": "turkey",
  "France": "france",
  "Germany": "germany",
  "United Kingdom": "united-kingdom",
  "Canada": "canada",
  "Australia": "australia"
  // أضف المزيد هنا حسب حاجتك (key = ما في الـ <select> ، value = slug في trends24)
};

let browserPromise = null;
// lazy-launch browser to reuse instance between requests
async function getBrowser() {
  if (browserPromise) return browserPromise;
  browserPromise = puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    headless: "new"
  });
  return browserPromise;
}

app.get("/trends/:country", async (req, res) => {
  const countryName = req.params.country;
  const slug = COUNTRY_SLUGS[countryName];

  if (!slug) {
    return res.json({ error: "دولة غير مدعومة" });
  }

  const url = `https://trends24.in/${slug}/`;
  let browser;
  try {
    browser = await getBrowser();
    const page = await (await browser).newPage();

    // وضع user-agent و بعض رؤوس أخرى لتقليل فرص الحجب
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );
    await page.setExtraHTTPHeaders({
      "Accept-Language": "en-US,en;q=0.9"
    });

    // اذهب للرابط وانتظر شبكة خاملة
    await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });

    // جرب أكثر من سيلكتور لأن الموقع قد يغير الهيكلة
    const selectors = [
      "ol.trending-list li a",            // قديم / شائع
      ".trend-card__list li .trend-name a",
      ".trend-card a",
      ".trend-card li a",
      ".trend-card__list li a"
    ];

    let trends = [];

    for (const sel of selectors) {
      const exists = await page.$(sel);
      if (!exists) continue;

      trends = await page.$$eval(sel, (els) =>
        els.slice(0, 24).map((el) => {
          const name = el.innerText.trim();
          let link = el.getAttribute("href") || "";
          // تحويل الروابط النسبية إلى مطلقة
          if (link && link.startsWith("/")) {
            link = new URL(link, "https://trends24.in").href;
          }
          // لو الرابط هو hashtag بحث تويتر، نفضل توجيه المستخدم لبحث تويتر
          if (!link || link.includes("trends24")) {
            const q = encodeURIComponent(name);
            link = `https://twitter.com/search?q=${q}`;
          }
          return { name, link };
        })
      );

      if (trends.length > 0) break; // وجدنا عناصر، لا نحتاج تجارب أخرى
    }

    // تأكد أن النتائج غير فارغة
    if (!trends || trends.length === 0) {
      // ممكن الموقع استعمل طريقة تحميل ديناميكية مختلفة
      return res.json({ error: "لا توجد ترندات أو تغيّرت بنية المصدر" });
    }

    // أرسل أول 10 عناصر بصيغة بسيطة
    res.json(trends.slice(0, 10));
    await page.close();
  } catch (err) {
    console.error("Scrape error:", err && err.message ? err.message : err);
    return res.status(500).json({ error: "فشل في جلب الترند" });
  }
});

// مسار اختبار صحي
app.get("/_ping", (req, res) => res.json({ ok: true }));

// إغلاق المتصفح عند انتهاء العملية (نظيف)
process.on("SIGINT", async () => {
  if (browserPromise) {
    (await browserPromise).close().catch(() => {});
  }
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
