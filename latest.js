const { builtinModules } = require("module");
const puppeteer = require("puppeteer");

async function scrapeLatest(symbol, page) {
  let url = `https://seekingalpha.com/symbol/${symbol}/balance-sheet`;

  try {
    await page.goto(url, { waitUntil: "networkidle0" });
    const data = await page.evaluate(() => {
      let obj = {};
      let varname;
      const root = document.querySelector(
        "#content > div > div.gB.bgA.bgR.bgU > div > div > div:nth-child(3) > div > div > section > div > div.gqM > div:nth-child(2) > div.jaA.jaF.bugA.bhGN > div > table > tbody"
      );
      console.log(root.textContent);
      root.childNodes.forEach((financial) => {
        console.log(financial.textContent);
        if (!financial.childNodes[0].innerHTML) return;
        varname = financial.childNodes[0].innerHTML;
        obj[varname] =
          financial.childNodes[financial.childNodes.length - 1].textContent;
      });
      console.log(obj);
      return obj;
    });
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
