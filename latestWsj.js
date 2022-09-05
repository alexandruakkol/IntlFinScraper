const puppeteer = require("puppeteer");

async function scrapeLatest(symbol, page) {
    let url = `https://www.wsj.com/market-data/quotes/${symbol}/financials/quarter/balance-sheet`;

    try {
      await page.goto(url, { waitUntil: "networkidle0"});
      const data = await page.evaluate(() => {
        let obj = {}
        const root = document.querySelector("#cr_cashflow > div.expanded > div.cr_cashflow_table > table > tbody");

        Array.prototype.forEach.call(root.childNodes, (financial)=>{
          if(financial.className!='hide' && financial.nodeName!='#text'){
            let key = financial.childNodes[1].textContent;
            obj[key]= financial.childNodes[3].textContent}
        })
        return obj;
      })
      return data;
    } catch (error) {
      console.log(symbol, "incomeStatement", error);
    }
  }

  //TESTING
(async () => {
  const browser = await puppeteer.launch({ headless: true,});
  const page = await browser.newPage();
  return { page, browser };
})().then(async (init) => {
  scrapeLatest("AAPL", init.page).then(r=>console.log(r))
});


