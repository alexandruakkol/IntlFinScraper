const puppeteer = require("puppeteer");
const compute = require("./compute");
const insertRow = require("./postgres");

const dbData = [
  "mcap",
  "ncavpspPct",
  "ncavpspPct_fixed",
  "roePct",
  "roce",
  "pe",
  "dePct",
  "interestRatePct",
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
async function scrapeLatest(symbol, page) {
  let balanceSheetURL = `https://www.wsj.com/market-data/quotes/${symbol}/financials/quarter/balance-sheet`;
  let incomeStatementURL = `https://www.wsj.com/market-data/quotes/${symbol}/financials/quarter/income-statement`;

  try {
    ////////Balance sheet\\\\\\\\

    await page.goto(
      balanceSheetURL,
      { waitUntil: "domcontentloaded" },
      { timeout: 0 }
    );
    sleep(1000);
    const balanceSheet = await page.evaluate(() => {
      const error = document.querySelector("#cr_cashflow > span");
      if (error) return { error: "pageDown" };

      //assets
      let obj = {};
      const assetsRoot = document.querySelector(
        "#cr_cashflow > div.expanded > div.cr_cashflow_table > table > tbody"
      );
      Array.prototype.forEach.call(assetsRoot.childNodes, (financial) => {
        if (financial.className != "hide" && financial.nodeName != "#text") {
          let key = financial.childNodes[1].textContent;
          let value = financial.childNodes[3].textContent;
          if (value.includes("%"))
            obj[key] = value = value.replace("%", "") / 100;
          else obj[key] = value.replace(",", "") * 1;
        }
      });

      //liabilities
      const liabsRoot = document.querySelector(
        "#cr_cashflow > div.collapsed > div.cr_cashflow_table > table > tbody"
      );
      Array.prototype.forEach.call(liabsRoot.childNodes, (financial) => {
        if (financial.className != "hide" && financial.nodeName != "#text") {
          let key = financial.childNodes[1].textContent;
          let value = financial.childNodes[3].textContent;
          if (value.includes("%"))
            obj[key] = value = value.replace("%", "") / 100;
          else obj[key] = value.replace(",", "") * 1;
        }

        //price
        const price = document.querySelector("#quote_val");
        obj["Price"] = price.textContent * 1;
      });
      return obj;
    });

    if (balanceSheet.error) {
      console.log(symbol, balanceSheet.error);
      return "error";
    }
    ////////IncomeStatement\\\\\\\\\\\\

    await page.goto(
      incomeStatementURL,
      { waitUntil: "domcontentloaded" },
      { timeout: 0 }
    );
    sleep(1000);
    const incomeStatement = await page.evaluate(() => {
      let obj = {};

      const root = document.querySelector(
        "#cr_cashflow > div.expanded > div.cr_cashflow_table > table > tbody"
      );
      Array.prototype.forEach.call(root.childNodes, (financial) => {
        if (financial.className != "hide" && financial.nodeName != "#text") {
          let key = financial.childNodes[1].textContent;
          let value = financial.childNodes[3].textContent;
          if (value.includes("%")) {
            obj[key] = value = value.replace("%", "") / 100;
          } else {
            if (Array.from(value)[0] == "(")
              obj[key] =
                value.replace(",", "").replace("(", "").replace(")", "") * -1;
            else obj[key] = value.replace(",", "") * 1;
          }
        }
      });

      return obj;
    });

    return {
      ...balanceSheet,
      ...incomeStatement,
      ...{ date: new Date().toLocaleDateString("en-US") },
    };
  } catch (error) {
    console.log(symbol, error);
  }
}

async function makeBrowser() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  return { page, browser };
}

makeBrowser().then(async (init) => {
  const symbol = "ebay";

  let tryCounter = 1;
  while (tryCounter < 6) {
    resp = await scrapeLatest(symbol, init.page);
    if (resp != "error") {
      try {
        resp = compute(resp);
        insertRow(Object.entries(resp).filter(pair=>dbData.includes(pair[0])));
      } catch (er) {
        console.log(`${symbol} computing error, ${er}`);
      }
      break;
    }
    tryCounter++;
    console.log(`${symbol} scraping fail: try #${tryCounter}`);
  }
  init.browser.close();
});
