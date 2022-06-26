const puppeteer = require("puppeteer");
const scrapeLatest = require("./latest");
const writeToDb = require('./dbConnect');

//first, init pup
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  return { page, browser };
})()//then, scrape per symbol
    .then(async (init) => { 
        for(symbol of ['AAPL', 'NFLX']){
            await scrapeLatest(symbol, init.page).then((data) => {writeToDb(data)});
        }
        init.browser.close();
    })

