const puppeteer = require("puppeteer");
const scrapeLatest = require("./latest");

//first, init pup
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  return { page, browser };
})()
    .then(async (init) => { 
        for(symbol of ['AAPL', 'NFLX']){
            await scrapeLatest(symbol, init.page).then((data) => console.log(data));
        }
        init.browser.close();
    })


async function closeBrowser(browser) {
  await browser.close();
}

//scrapeSymbol(symbol).then(async (br)=>await br.close());
