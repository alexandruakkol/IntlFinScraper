const { builtinModules } = require("module");

async function scrapeLatest(symbol, page) {
    let url = `https://roic.ai/financials/${symbol}`;
  
    try {
      await page.goto(url, { waitUntil: "networkidle0" });
      const data = await page.evaluate(() => {
        let results = [];
        let obj = {};
        let varname;
        const root = document.querySelector(
          "#__next > div > main > div.w-full.mt-5.sm\\:px-5.md\\:px-20.lg\\:px-30.xl\\:px-30 > div > div > div > div.flex-col.overflow-x-auto"
        );
        root.childNodes.forEach((financial) => {
          varname = financial.childNodes[0].childNodes[0].innerHTML;
          if (financial.childElementCount === 3) {
  
              obj[varname] =
                financial.childNodes[2].childNodes[
                  financial.childNodes[2].childNodes.length - 1
                ].textContent;
              results.push(obj);
          
          }
        });
        return results;
      });
      console.log(data);
    } catch (error) {
      console.error(symbol, "incomeStatement", error);
    }
  }

module.exports=scrapeLatest;