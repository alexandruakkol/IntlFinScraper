const puppeteer = require("puppeteer");
const scrapeLatest = require("./latest");
const { writeToDb, checkIfExists } = require("./dbConnect");
const getTickers = require("./getAllUSTickers");

const overwriteMode = false;

getTickers().then((res) => {
  (async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    return { page, browser };
  })() //then, scrape per symbol
    .then(async (init) => {
      for (symbol of res) {
        await scrapeLatest(symbol, init.page).then((data) => {
          if (!overwriteMode) {
            if (data) {
              checkIfExists(data._id).then((res) => {
                if (res === 1) writeToDb(date);
                else
                  console.log(`Symbol ${symbol} already in database. Skipped.`);
              });
            } else
              console.log(`Symbol ${symbol} already in database. Skipped.`);
          } else {
            writeToDb(data);
          }
        });
      }
      init.browser.close();
    });
});
