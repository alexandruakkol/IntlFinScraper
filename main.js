const puppeteer = require("puppeteer"),
    InitCompute = require("./compute"),
    { insertCluster, getExistingSymbols, getGlobalInitData } = require("./postgres"),
    //getUSTickers = require("./getAllUSTickers"),
    scrapeLatest = require("./scrapeLatest"),
    scrapeHistory = require('./scrapeHistory'),
    scrapeTickers = require('./scrapeWsjTickers');  //used to fill tickersxw table with all global tickers 
    //..to be run just once in a while

//global init
global.appdata = { baseLink : 'https://www.wsj.com/market-data/quotes/'};
//end global init

function structureData(data, checkIntegrity=false){
  function joinByYear(arr1,arr2,arr3,arr4,arr5,arr6){
    if(checkIntegrity){
      Array.from(arguments).forEach(arg=>{
        if(!arg || !Array.isArray(arg) || !Object.keys(arg).length) throw new Error ('Data integrity fail');
      });
      return;
    }
    let arrFin=[];
    arr1.map(arr1PerYr=>{
      let arr2SameYr = arr2.filter(arr2PerYr=>arr2PerYr.Year==arr1PerYr.Year)[0];
      let arr3SameYr = arr3.filter(arr3PerYr=>arr3PerYr.Year==arr1PerYr.Year)[0];
      let arr4SameYr = arr4.filter(arr4PerYr=>arr4PerYr.Year==arr1PerYr.Year)[0];
      let arr5SameYr = arr5.filter(arr5PerYr=>arr5PerYr.Year==arr1PerYr.Year)[0];
      let arr6SameYr = arr6.filter(arr6PerYr=>arr6PerYr.Year==arr1PerYr.Year)[0];
      arrFin.push({...arr1PerYr,...arr2SameYr,...arr3SameYr,...arr4SameYr,...arr5SameYr,...arr6SameYr, Currency:data.Currency, Denom:data.Denom, Price:data.Price, Symbol:data.Symbol, Sector:data.Sector, Timeframe:data.Timeframe, ScrapeDate:data.ScrapeDate});
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
  let data, existingSymbols, dataToScrape=[];
  switch (mode) {
    case "APPEND-ONLY":
      //data = await getMarginalUSTickers(init.page);
      data = await getGlobalInitData();
      existingSymbols = await getExistingSymbols();
      data.forEach(d=>{if(!existingSymbols.includes(d.Symbol)) dataToScrape.push(d)});
      var noSymbolsYetToPull = dataToScrape.length;
      console.log(`${mode} mode. Pulling ${noSymbolsYetToPull} of ${data.length} total symbols.`);
      break;
    case "OVERWRITE":
      dataToScrape = await getGlobalInitData();
      console.log(mode, "mode.", "Pulling", dataToScrape.length, "symbols.");
      break;
    default:
      console.log("Wrong mode.");
      return;
  }

  //start scraping
  for (SymbolCluster of dataToScrape) {
    const {Symbol, Link, Sector} = SymbolCluster;
    console.log(`${Symbol} | ${((1-(noSymbolsYetToPull/data.length))*100).toFixed(2)}% done`)
    let tryCounter = 1, latest, allData;
    while (tryCounter < 3) {
      try {
        latest = await scrapeLatest(Symbol, Link, init.page);
        allData = await scrapeHistory(Symbol, Link, init.page);  //this returns scraped, unjoined data
        if(latest.error || allData.error) throw 'PageDown error'
        structureData(allData, true)  //check data integrity
        break;
      } catch(err) {
        tryCounter++;
        debug ? console.log(`--${Symbol} scraping fail: try #${tryCounter}`) : null;
        if (tryCounter == 3) {console.log(`--${Symbol} total scraping fail`); allData = 'error'}
      } 
    }
    if (allData != "error" && latest !='error') {
        allData.Symbol=Symbol; allData.Sector = Sector;
        allData = structureData(allData, false);
        allData.push({...latest, Symbol});
        allData = InitCompute(allData).then(res=>{ // DB insert
          if (res != "error") insertCluster(res, Symbol)
        })
    } 
    noSymbolsYetToPull--;
  }
  init.browser.close();
});
