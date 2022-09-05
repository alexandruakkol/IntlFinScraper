const puppeteer = require("puppeteer");

async function scrapeLatest(symbol, page) {
  let url = `https://finance.yahoo.com/quote/${symbol}/financials?p=${symbol}`;

  try {
    await page.goto(url, { waitUntil: "networkidle0"});
    const data = await page.evaluate(() => {
      let obj = {};
      let varname;
      const root = document.querySelector(
        "#Col1-1-Financials-Proxy > section > div.Pos\\(r\\) > div.W\\(100\\%\\).Whs\\(nw\\).Ovx\\(a\\).BdT.Bdtc\\(\\$seperatorColor\\) > div > div.D\\(tbrg\\)"
      );
      
      return root.textContent;
    });
    
    console.log({ _id: symbol, ...data });
    return { _id: symbol, ...data };
  } catch (error) {
    console.error(symbol, "incomeStatement", error);
  }
}

//TESTING
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  return { page, browser };
})().then(async (init) => {
  scrapeLatest("AAPL", init.page);
});

module.exports = scrapeLatest;
