const puppeteer = require("puppeteer"),
      compute = require("./compute"),
    { insertRow, getTickers } = require("./postgres"),
      getBaseTickers = require("./getAllUSTickers"),
    { scrapeLatest } = require("./scrapeLatest"),
    { scrapeHistory } = require('./scrapeHistory')
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

function structureData(data, checkIntegrity=false){
  //if(!Object.keys(data).length)throw 'Data integrity fail, no data!'
  function joinByYear(arr1,arr2,arr3,arr4,arr5,arr6){
    if(checkIntegrity){
      Array.from(arguments).forEach(arg=>{
        if(!arg || !Array.isArray(arg) || !Object.keys(arg).length) throw new Error ('Data integrity fail');
      });
      return;
    }
    let arrFin=[];
    arr1.map(arr1PerYr=>{
      let arr2SameYr = arr2.filter(arr2PerYr=>arr2PerYr.year==arr1PerYr.year)[0];
      let arr3SameYr = arr3.filter(arr3PerYr=>arr3PerYr.year==arr1PerYr.year)[0];
      let arr4SameYr = arr4.filter(arr4PerYr=>arr4PerYr.year==arr1PerYr.year)[0];
      let arr5SameYr = arr5.filter(arr5PerYr=>arr5PerYr.year==arr1PerYr.year)[0];
      let arr6SameYr = arr6.filter(arr6PerYr=>arr6PerYr.year==arr1PerYr.year)[0];
      arrFin.push({...arr1PerYr,...arr2SameYr,...arr3SameYr,...arr4SameYr,...arr5SameYr,...arr6SameYr, Currency:data.Currency, Denom:data.Denom, Price:data.Price, Symbol:Symbol, Timeframe:data.Timeframe, ScrapeDate:data.ScrapeDate});
    })
    return arrFin;
  }
  data = joinByYear(data['assetsData'], data['incomeSt'], data['liabsData'], data['operatingCF'], data['investingCF'], data['financingCF']);
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
  for (Symbol of data.tickers) {Symbol='AAPL'
    let tryCounter = 1, latest, allData;
    while (tryCounter < 3) {
      try{
        latest = await scrapeLatest(Symbol, init.page);
        allData = await scrapeHistory(Symbol, init.page);  //this returns scraped, unjoined data
        if(latest.error || allData.error) throw 'PageDown error'
        structureData(allData, true)  //check data integrity
        break;
      } catch(err) {
        tryCounter++;
        debug ? console.log(`--${Symbol} scraping fail: try #${tryCounter}`) : null;
        if (tryCounter == 3) {console.log(`--${Symbol} total scraping fail`); allData='error'}
      } 
    }
    if (allData != "error" && latest !='error') {
        allData = structureData(allData);
        allData.push({...latest,Symbol:Symbol});
        console.log(allData);
        try {
          // Object.entries(dbData).forEach((pair) => {
          //   //translate keys via dbData dictionary
          //   let key = pair[0],
          //     newkey = dbData[key];
          //   resp[newkey] = resp[key];
          // });
          // insertRow(
          //   Object.entries(resp).filter((pair) =>
          //     Object.values(dbData).includes(pair[0])
          //   )
          // );
        } catch (er) {
          console.log(`${Symbol} computing error, ${er}`);
        }
      }
     
    }
    
  
  init.browser.close();
});
