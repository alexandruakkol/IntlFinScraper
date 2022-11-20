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
    ////////Balance sheet\\\\\\\
    await page.goto(
      balanceSheetURL,
      { waitUntil: "domcontentloaded" },
      { timeout: 0 }
    );
      
    const balanceSheet = await page.evaluate(() => {
      //scrape elements
      const error = document.querySelector("#cr_cashflow > span");
      if (error) return { error: "pageDown" };
      const meta = document.querySelector(".fiscalYr").textContent.split(" ");
      const price = document.querySelector("#quote_val").textContent;
      const assetsTable = document.querySelector("#cr_cashflow > div.expanded > div.cr_cashflow_table > table");
      const liabsTable = document.querySelector("#cr_cashflow > div.collapsed > div.cr_cashflow_table > table");
      
      //html table to json time series
      function table2data(tableEl){
        let data=[], columns=[], formattedData=[];
        Array.prototype.forEach.call(tableEl.tHead.childNodes[1].childNodes,(th)=>{
          if(th.textContent.startsWith('20'))columns.push(th.textContent);
        })
        Array.prototype.forEach.call(tableEl.childNodes[3].childNodes,tr=>{
          if (tr.className != "hide" && tr.nodeName != "#text") {
            let internalIdx=-2;
            Array.prototype.forEach.call(tr.childNodes,(financial,idx)=>{
              if(idx>11)return;
              if(financial.nodeName != "#text"){
                let year = columns[internalIdx+idx];
                data[year]={...data[year],...{[tr.childNodes[1].textContent]:financial.textContent}}
                internalIdx--;
              }
            });
          }
        })
        Object.keys(data).map(yr=>{
          if(yr == 'undefined')return;
          formattedData.push({...data[yr],...{year:yr}})
        })
        return formattedData;
      }

      const currency = meta[meta.length - 2], denom = meta[meta.length - 1].replace(".", "");
      let assetsData=table2data(assetsTable);
      let liabsData=table2data(liabsTable)

      return {assetsData, liabsData, currency, denom, price};
    });
    ////////end balance sheet\\\\\\\

    if (balanceSheet.error) {
      debug ? console.log(Symbol, balanceSheet.error) : null;
      return "error";
    }
    //////IncomeStatement\\\\\\\\\\\\

    await page.goto(
      incomeStatementURL,
      { waitUntil: "domcontentloaded" },
      { timeout: 0 }
    );

    const incomeStatement = await page.evaluate(() => {
      //scrape elements
      const error = document.querySelector("#cr_cashflow > span");
      if (error) return { error: "pageDown" };
      const incomeTable = document.querySelector("#cr_cashflow > div.expanded > div > table")
      
      //html table to json time series
      function table2data(tableEl){
        let data=[], columns=[], formattedData=[];
        Array.prototype.forEach.call(tableEl.tHead.childNodes[1].childNodes,(th)=>{
          if(th.textContent.startsWith('20'))columns.push(th.textContent);
        })
        Array.prototype.forEach.call(tableEl.childNodes[3].childNodes,tr=>{
          if (tr.className != "hide" && tr.nodeName != "#text") {
            let internalIdx=-2;
            Array.prototype.forEach.call(tr.childNodes,(financial,idx)=>{
              if(idx>11)return;
              if(financial.nodeName != "#text"){
                let year = columns[internalIdx+idx];
                data[year]={...data[year],...{[tr.childNodes[1].textContent]:financial.textContent}}
                internalIdx--;
              }
            });
          }
        })
        Object.keys(data).map(yr=>{
          if(yr == 'undefined')return;
          formattedData.push({...data[yr],...{year:yr}})
        })
        return formattedData;
      }

      let incomeSt=table2data(incomeTable);

      return {incomeSt};
    });
    ////////end income statement\\\\\\\

    return {
      ...balanceSheet,
      ...incomeStatement,
      ...{ ScrapeDate: new Date().toLocaleDateString("en-US") },
    };


   } catch (error) {
     debug ? console.log("--", Symbol, error) : null;
  }
}

function structureData(data){
  function joinByYear(arr1,arr2,arr3){let arr4=[];
    arr1.map(arr1PerYr=>{
      let arr2SameYr = arr2.filter(arr2PerYr=>arr2PerYr.year==arr1PerYr.year)[0];
      let arr3SameYr = arr3.filter(arr3PerYr=>arr3PerYr.year==arr1PerYr.year)[0];
      //console.log(arr1PerYr,arr2SameYr,arr3SameYr)
      arr4.push({...arr1PerYr,...arr2SameYr, ...arr3SameYr,currency:data.currency,denom:data.denom,price:data.price, symbol:Symbol});
    })
    return arr4;
  }
  data = joinByYear(data.assetsData, data.incomeSt, data.liabsData);
  return data;
}

async function makeBrowser() {
  const browser = await puppeteer.launch({ headless: true });
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
      resp = await scrapeHistory(Symbol, init.page);  //this returns scraped, unjoined data
      resp=structureData(resp);
      console.log(resp)
      if (resp != "error") {
        try {
          //resp = compute(resp);
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
