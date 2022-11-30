const puppeteer = require("puppeteer"),
    InitCompute = require("./compute"),
    { insertCluster, getTickers } = require("./postgres"),
    getBaseTickers = require("./getAllUSTickers"),
    {scrapeLatest} = require("./scrapeLatest"),
    {scrapeHistory} = require('./scrapeHistory');

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
  let data = {};
  switch (mode) {
    case "APPEND-ONLY":
      data = await getTickers();
      var noSymbolsYetToPull = data.tickers.length;
      console.log(`${mode} mode. Pulling ${noSymbolsYetToPull} of ${data.baseCounter} total symbols.`);
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
  for (Symbol of data.tickers) {
    console.log(`${Symbol} | ${((1-(noSymbolsYetToPull/data.baseCounter))*100).toFixed(2)}% done`)
    let tryCounter = 1, latest, allData;
    while (tryCounter < 3) {
      try {
        latest = await scrapeLatest(Symbol, init.page);
        allData = await scrapeHistory(Symbol, init.page);  //this returns scraped, unjoined data
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
        allData = structureData(allData);
        allData.push({...latest,Symbol:Symbol});
        allData = InitCompute(allData).then(res=>{ // DB insert
          if (res != "error") insertCluster(res, Symbol) 
        })
    } 
    noSymbolsYetToPull--;
  }
  init.browser.close();
});
