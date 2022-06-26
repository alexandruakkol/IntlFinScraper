const puppeteer = require("puppeteer");
const scrapeLatest = require("./latest");

async function puppetPageInit() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  return {page,browser};
}

let symbol = "AAPL";

async function scrapeSymbol(symbol) {
  const init = await puppetPageInit();
  await scrapeLatest(symbol, init.page);
  return init.browser
}

async function closeBrowser(browser){
   await browser.close();
}

scrapeSymbol(symbol).then(async (br)=>await br.close());

