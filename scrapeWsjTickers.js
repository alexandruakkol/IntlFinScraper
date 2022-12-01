async function scrapeTickers(page) {
    const azList = 'https://www.wsj.com/market-data/quotes/company-list/a-z/';
    const categories = ['A'];

    for(category of categories){    
        await page.goto( azList+category,{ waitUntil: "domcontentloaded" },{ timeout: 0 } );

        const data = await page.evaluate(() => {
            const table = document.querySelector("body > div.pageFrame.navType-black.subType-unsubscribed > section.sector.cl_section > div > section > table > tbody");
            Array.from(table.childNodes).forEach(row=>{ //for each table row
                if(row.nodeName != "#text" && typeof row != 'undefined'){
                    let rowData = Array.from(row.childNodes);   
                    let firstTD = rowData[1]; 
                    let link = Array.from(firstTD.childNodes)[0].href;
                    let symbol = link.split('/')[link.split('/').length];
                }
     
            })

        })

    }
}

module.exports = scrapeTickers;