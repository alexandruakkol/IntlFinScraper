const puppeteer = require("puppeteer");

async function puppetPageInit() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  return page;
}


let symbol = "AAPL";

async function scrapeSymbol(symbol){
    const page = await puppetPageInit();
    scrapeIncomeStatement(symbol, page);    
}

async function scrapeIncomeStatement(symbol, page) {
  let url = `https://roic.ai/financials/${symbol}`;
    
    
  try {
    await page.goto(url, { waitUntil: "networkidle0" });
    const data = await page.evaluate(() => {
        let results=[];
        let obj={};
        const root = document.querySelector("#__next > div > main > div.w-full.mt-5.sm\\:px-5.md\\:px-20.lg\\:px-30.xl\\:px-30 > div > div > div > div.flex-col.overflow-x-auto");
        root.childNodes.forEach(financial => {
            obj[financial.childNodes[0].childNodes[0].innerHTML]=4
            results.push(obj)
        })
        return results;
    });
    console.log(data);
  } catch (error) {
    console.error(symbol, "incomeStatement", error);
  }
}

scrapeSymbol(symbol);
module.exports =  scrapeIncomeStatement;