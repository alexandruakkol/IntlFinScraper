

async function scrapeLatest(symbol, page) {
    let url = `https://www.wsj.com/market-data/quotes/${symbol}/financials/quarter/balance-sheet`;

    try {
      await page.goto(url, { waitUntil: "networkidle0" });
      const data = await page.evaluate(() => {
        let obj = [];
        const root = document.querySelector("#cr_cashflow > div.expanded > div.cr_cashflow_table > table > tbody");
        
        root.childNodes.forEach((financial)=> {
          if(financial.childElementCount && !financial.className) obj.financial.childNodes[1].textContent=financial.childNodes[financial.childNodes.length-1].textContent
        })

        return obj;
      })
      return data;
    } catch (error) {
      console.error(symbol, "incomeStatement", error);
    }
  }

module.exports=scrapeLatest;

