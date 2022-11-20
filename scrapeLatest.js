async function scrapeLatest(Symbol, page) {

  let balanceSheetURL = `https://www.wsj.com/market-data/quotes/${Symbol}/financials/quarter/balance-sheet`;
  let incomeStatementURL = `https://www.wsj.com/market-data/quotes/${Symbol}/financials/quarter/income-statement`;
  let cashflowStatementURL = `https://www.wsj.com/market-data/quotes/${Symbol}/financials/quarter/cash-flow`;

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
        const year = document.querySelector("#cr_cashflow > div.expanded > div.cr_cashflow_table > table > thead > tr > th:nth-child(2)").textContent;
        const price = document.querySelector("#quote_val").textContent;
        const assetsRoot = document.querySelector("#cr_cashflow > div.expanded > div.cr_cashflow_table > table > tbody");
        const liabsRoot = document.querySelector("#cr_cashflow > div.collapsed > div.cr_cashflow_table > table > tbody");

        function extractData(root){
            let obj={};
            Array.prototype.forEach.call(root.childNodes, (financial) => {
                if (financial.className != "hide" && financial.nodeName != "#text") {
                let key = financial.childNodes[1].textContent;
                let value = financial.childNodes[3].textContent;
                if (value.includes("%"))
                    obj[key] = value = value.replace("%", "") / 100;
                else obj[key] = value.replace(",", "") * 1;
                }
            });
            return obj;
        }

        let assets=extractData(assetsRoot);
        let liabs=extractData(liabsRoot);

        let extra = {};
        extra["Price"] = price * 1;
        extra["Denom"] = denom;
        extra["Currency"] = currency;
        extra["Year"] = year;
        extra['Timeframe']='Q';

        return {...assets,...liabs,...extra};
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

      const root = document.querySelector("#cr_cashflow > div.expanded > div.cr_cashflow_table > table > tbody");
      Array.prototype.forEach.call(root.childNodes, (financial) => {
        if (financial.className != "hide" && financial.nodeName != "#text") {
          let key = financial.childNodes[1].textContent;
          let value = financial.childNodes[3].textContent;
          if (value.includes("%")) obj[key] = value = value.replace("%", "") / 100;
            else {
              if (Array.from(value)[0] == "(")
                obj[key] = value.replace(",", "").replace("(", "").replace(")", "") * -1;
              else obj[key] = value.replace(",", "") * 1;
            }
        }
      });

      return obj;
    });

    ////////Cashflow statement\\\\\\\\\\\\

    await page.goto(
        cashflowStatementURL,
        { waitUntil: "domcontentloaded" },
        { timeout: 0 }
      );
      const cashflowStatement = await page.evaluate(() => {
          
        const operatingCFTable = document.querySelector("#cr_cashflow > div.expanded > div.cr_cashflow_table > table > tbody");
        const investingCFTable = document.querySelector("#cr_cashflow > div:nth-child(3) > div.cr_cashflow_table > table > tbody");
        const financingCFTable = document.querySelector("#cr_cashflow > div:nth-child(4) > div.cr_cashflow_table > table > tbody");
    
        function extractData(root){
        let obj = {};
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
        }
        
        const operatingCF = extractData(operatingCFTable);
        const investingCF = extractData(investingCFTable);
        const financingCF = extractData(financingCFTable);

        return {...operatingCF, ...investingCF, ...financingCF};
      });

    return {
      ...balanceSheet,
      ...incomeStatement,
      ...cashflowStatement,
      ...{ ScrapeDate: new Date().toLocaleDateString("en-US") },
    };
  } catch (error) {
    debug ? console.log(`-- try #${failCounter}`, Symbol, error) : null;
  }
}

module.exports = { scrapeLatest };