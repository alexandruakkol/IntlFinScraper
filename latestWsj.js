const puppeteer = require("puppeteer");
const compute = require('./compute');
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
async function scrapeLatest(symbol, page) {
  let balanceSheetURL = `https://www.wsj.com/market-data/quotes/${symbol}/financials/quarter/balance-sheet`;
  let incomeStatementURL = `https://www.wsj.com/market-data/quotes/${symbol}/financials/quarter/income-statement`;
  
  try {
    ////////Balance sheet\\\\\\\\

    await page.goto(balanceSheetURL, { waitUntil: "networkidle0"}, {timeout: 0});
    sleep(1000);
    const balanceSheet = await page.evaluate(() => {

      const error = document.querySelector("#cr_cashflow > span")
      if(error)return {'error':'pageDown'};

      //assets
      let obj = {}
      const assetsRoot = document.querySelector("#cr_cashflow > div.expanded > div.cr_cashflow_table > table > tbody");
      Array.prototype.forEach.call(assetsRoot.childNodes, (financial)=>{
        if(financial.className!='hide' && financial.nodeName!='#text'){
          let key = financial.childNodes[1].textContent;
          let value = financial.childNodes[3].textContent;
          if(value.includes('%'))obj[key]=value=value.replace('%','')/100
          else
          obj[key]= value.replace(',','')* 1
        }
      })

      //liabilities
      const liabsRoot = document.querySelector("#cr_cashflow > div.collapsed > div.cr_cashflow_table > table > tbody");
      Array.prototype.forEach.call(liabsRoot.childNodes, (financial)=>{
        if(financial.className!='hide' && financial.nodeName!='#text'){
          let key = financial.childNodes[1].textContent;
          let value = financial.childNodes[3].textContent;
          if(value.includes('%'))obj[key]=value=value.replace('%','')/100
          else
          obj[key]= value.replace(',','')* 1
        }

      //price
      const price = document.querySelector("#quote_val");
      obj['Price']=price.textContent*1;
      })
      return obj;
    })

    if(balanceSheet.error){console.log(symbol ,balanceSheet.error);return 'error';}
    ////////IncomeStatement\\\\\\\\\\\\

    await page.goto(incomeStatementURL, { waitUntil: "networkidle0"}, {timeout: 0});
    sleep(1000)
    const incomeStatement = await page.evaluate(() => {

      let obj = {};

      const root = document.querySelector("#cr_cashflow > div.expanded > div.cr_cashflow_table > table > tbody");
      Array.prototype.forEach.call(root.childNodes, (financial)=>{
        if(financial.className!='hide' && financial.nodeName!='#text'){
          let key = financial.childNodes[1].textContent;
          let value = financial.childNodes[3].textContent;
          if(value.includes('%'))obj[key]=value=value.replace('%','')/100
          else
          obj[key]= value.replace(',','')* 1
        }
      })

      return obj;
    })

    return {...balanceSheet, ...incomeStatement, ...{'date':new Date()}};
  } catch (error) {
    console.log(symbol, error);
  }
}

async function makeBrowser(){
  const browser = await puppeteer.launch({ headless: true,});
  const page = await browser.newPage();
  return { page, browser };
}

makeBrowser().then(async (init) => {
  scrapeLatest("AAPL", init.page).then(r=>{
   if(r!='error')compute(r); 
   init.browser.close();
  })
});


