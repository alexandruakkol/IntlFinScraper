const puppeteer = require("puppeteer"),
  compute = require("./compute"),
  { insertRow, getTickers } = require("./postgres"),
  getBaseTickers = require("./getAllUSTickers");
const dbData = {
  Cenom: "Denom",
  Currency: "Currency",
  Symbol: "Symbol",
  ScrapeDate: "ScrapeDate",
  "Total Current Assets": "curassets",
  "Net Property, Plant & Equipment": "neppropertyplants",
  "Intangible Assets": "intangibles",
  "Total Assets": "totalassets",
  Price: "price",
  "Total Current Liabilities": "currentliabilities",
  "Quick Ratio": "quickratio",
  "Long-Term Debt": "ltdebt",
  "Total Liabilities": "totalliabilities",
  "Total Shareholders' Equity": "totalshareholdequity",
  "Total Equity": "totalequity",
  "Cost of Goods Sold (COGS) incl. D&A": "cogsplusda",
  "Depreciation & Amortization Expense": "depramortiz",
  "Research & Development": "rdexpenses",
  "Net Income": "netincome",
  "EPS (Basic)": "eps",
  "Basic Shares Outstanding": "sharesoutst",
  EBITDA: "ebitda",
  "EBITDA Margin": "ebitdamg",
  "Cash & Short Term Investments": "cashandst",
  mcap: "mcap",
  ncavpsppct: "ncavpsppct",
  ncavpsppct_fixed: "ncavpsppct_fixed",
  roepct: "roepct",
  roce: "roce",
  pe: "pe",
  depct: "depct",
  interestRatepct: "interestratepct",
};

async function scrapeLatest(Symbol, page) {Symbol='AAPL'
  let balanceSheetURL = `https://www.wsj.com/market-data/quotes/${Symbol}/financials/quarter/balance-sheet`;
  let incomeStatementURL = `https://www.wsj.com/market-data/quotes/${Symbol}/financials/quarter/income-statement`;

  try {
    ////////Balance sheet\\\\\\\\

    await page.goto(
      balanceSheetURL,
      { waitUntil: "domcontentloaded" },
      { timeout: 0 }
    );

    const balanceSheet = await page.evaluate(() => {
      const error = document.querySelector("#cr_cashflow > span");
      if (error) return { error: "pageDown" };
      const meta = document.querySelector(".fiscalYr").textContent.split(" ");
      const currency = meta[meta.length - 2],
        denom = meta[meta.length - 1].replace(".", "");
      const time = document.querySelector("#cr_cashflow > div.expanded > div.cr_cashflow_table > table > thead > tr > th:nth-child(2)").textContent;
      //assets
      let obj = {};
      const assetsRoot = document.querySelector(
        "#cr_cashflow > div.expanded > div.cr_cashflow_table > table > tbody"
      );

      Array.prototype.forEach.call(assetsRoot.childNodes, (financial) => {  console.log(financial)
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
        obj["Denom"] = denom;
        obj["Currency"] = currency;
        obj["Time"] = time;
        obj['Timeframe']='Q';
      });
      return obj;
    });

    if (balanceSheet.error) {
      debug ? console.log(Symbol, balanceSheet.error) : null;
      return "error";
    }
    ////////IncomeStatement\\\\\\\\\\\\

    await page.goto(
      incomeStatementURL,
      { waitUntil: "domcontentloaded" },
      { timeout: 0 }
    );
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
      ...{ ScrapeDate: new Date().toLocaleDateString("en-US") },
    };
  } catch (error) {
    debug ? console.log("--", Symbol, error) : null;
  }
}

async function scrapeHistory(Symbol, page) {Symbol='AAPL'

  let balanceSheetURL = `https://www.wsj.com/market-data/quotes/${Symbol}/financials/annual/balance-sheet`;
  let incomeStatementURL = `https://www.wsj.com/market-data/quotes/${Symbol}/financials/annual/income-statement`;

  try {
    ////////Balance sheet\\\\\\\\

    await page.goto(
      balanceSheetURL,
      { waitUntil: "domcontentloaded" },
      { timeout: 0 }
    );

    const balanceSheet = await page.evaluate(() => {
      const error = document.querySelector("#cr_cashflow > span");
      if (error) return { error: "pageDown" };
      const meta = document.querySelector(".fiscalYr").textContent.split(" ");
      const currency = meta[meta.length - 2],
        denom = meta[meta.length - 1].replace(".", "");
      const time = document.querySelector("#cr_cashflow > div.expanded > div.cr_cashflow_table > table > thead > tr > th:nth-child(2)").textContent;
      const price = document.querySelector("#quote_val");
      //assets
      const assetsTable = JSON.stringify(document.querySelector("#cr_cashflow > div.expanded > div.cr_cashflow_table > table"));

      //liabilities
      const liabsTable = document.querySelector("#cr_cashflow > div.collapsed > div.cr_cashflow_table > table");
      // Array.prototype.forEach.call(liabsRoot.childNodes, (financial) => {
      //   if (financial.className != "hide" && financial.nodeName != "#text") {
      //     let key = financial.childNodes[1].textContent;
      //     let value = financial.childNodes[3].textContent;
      //     if (value.includes("%"))
      //       obj[key] = value = value.replace("%", "") / 100;
      //     else obj[key] = value.replace(",", "") * 1;
      //   }

      //   //price
      //   const price = document.querySelector("#quote_val");
      //   obj["Price"] = price.textContent * 1;
      //   obj["Denom"] = denom;
      //   obj["Currency"] = currency;
      //   obj["Time"] = time;
      //   obj['Timeframe']='Q';
      // });
      return {assetsTable, liabsTable, time, currency, denom, price};
    });

    // if (balanceSheet.error) {
    //   debug ? console.log(Symbol, balanceSheet.error) : null;
    //   return "error";
    // }
    ////////IncomeStatement\\\\\\\\\\\\

  //   await page.goto(
  //     incomeStatementURL,
  //     { waitUntil: "domcontentloaded" },
  //     { timeout: 0 }
  //   );
  //   const incomeStatement = await page.evaluate(() => {
  //     let obj = {};

  //     const root = document.querySelector(
  //       "#cr_cashflow > div.expanded > div.cr_cashflow_table > table > tbody"
  //     );
  //     Array.prototype.forEach.call(root.childNodes, (financial) => {
  //       if (financial.className != "hide" && financial.nodeName != "#text") {
  //         let key = financial.childNodes[1].textContent;
  //         let value = financial.childNodes[3].textContent;
  //         if (value.includes("%")) {
  //           obj[key] = value = value.replace("%", "") / 100;
  //         } else {
  //           if (Array.from(value)[0] == "(")
  //             obj[key] =
  //               value.replace(",", "").replace("(", "").replace(")", "") * -1;
  //           else obj[key] = value.replace(",", "") * 1;
  //         }
  //       }
  //     });

  //     return obj;
  //   });

  //   return {
  //     ...balanceSheet,
  //     ...incomeStatement,
  //     ...{ ScrapeDate: new Date().toLocaleDateString("en-US") },
  //   };
  return balanceSheet
   } catch (error) {
     debug ? console.log("--", Symbol, error) : null;
  }


}

async function makeBrowser() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  return { page, browser };
}

makeBrowser().then(async (init) => {
  //mode logic
  let data = {},
    operationStatus;
  switch (mode) {
    case "APPEND-ONLY":
      data = await getTickers();
      console.log(
        mode,
        "mode.",
        "Pulling",
        data.tickers.length,
        "of",
        data.baseCounter,
        "total symbols."
      );
      break;
    case "OVERWRITE":
      data.tickers = await getBaseTickers();
      console.log(mode, "mode.", "Pulling", data.tickers.length, "symbols.");
      break;
    default:
      console.log("Wrong mode.");
      return;
  }

  //start scraping
  data.tickers=['AAPL']
  for (Symbol of data.tickers) {
    let tryCounter = 1;
    while (tryCounter < 3) {
      resp = await scrapeHistory(Symbol, init.page);
      console.log(resp);
      if (resp != "error") {
        try {
          resp = compute(resp);
          resp = { ...resp, ...{ Symbol } };

          //console.log(resp);
          return;


          Object.entries(dbData).forEach((pair) => {
            //translate keys via dbData dictionary
            let key = pair[0],
              newkey = dbData[key];
            resp[newkey] = resp[key];
          });
          insertRow(
            Object.entries(resp).filter((pair) =>
              Object.values(dbData).includes(pair[0])
            )
          );
        } catch (er) {
          console.log(`${Symbol} computing error, ${er}`);
        }
        break;
      }
      tryCounter++;
      debug
        ? console.log(`--${Symbol} scraping fail: try #${tryCounter}`)
        : null;
    }
    if (tryCounter == 3) console.log(`--${Symbol} scraping fail`);
  }
  init.browser.close();
});
