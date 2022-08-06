const puppeteer = require("puppeteer");
const scrapeLatest = require("./latestWsj");
const { writeToDb, checkIfExists } = require("./dbConnect");
const getTickers = require("./getAllUSTickers");

const overwriteMode = false;
const res = ['AAPL'];
  (async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    return { page, browser };
  })() //then, scrape per symbol
    .then(async (init) => {
      for (symbol of res) {
        await scrapeLatest(symbol, init.page).then((data) => {
         console.log(data);
        });
      }
      init.browser.close();
    });

