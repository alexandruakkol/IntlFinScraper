const {insertSymbols} = require('./postgres');
async function scrapeTickers(page) {
    const azListBase = 'https://www.wsj.com/market-data/quotes/company-list/a-z';
    const categories = ['0-9','a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];
    for(category of categories){   //loop through letters
        let pageCounter = 0;
        while(true){    //loop though each page
            let pageComponent = pageCounter==0?'' : `/${pageCounter}`
            let url = azListBase + `/${category}` + pageComponent;
            await page.goto( url, { waitUntil: "domcontentloaded" } , { timeout: 0 } );
            const pageDB = await page.evaluate(() => {
                let result = [];
                const table = document.querySelector("body > div.pageFrame.navType-black.subType-unsubscribed > section.sector.cl_section > div > section > table > tbody");
                if(Array.from(table.childNodes).length==1) return 'exit'
                Array.from(table.childNodes).forEach(row=>{ //for each table row
                    if(row.nodeName != "#text" && row){
                        let rowData = Array.from(row.childNodes);   
                        let firstTD =rowData[1]; //extract the link
                        let link = Array.from(firstTD.childNodes)[0].href; 
                        let symbol = link.split('/')[link.split('/').length-1]; 
                        link = link.replace('https://www.wsj.com/market-data/quotes/','');
                        let sector = rowData[7].textContent;
                        result.push({symbol, link, sector})
                    }
                })
                return result;
            })
            if(pageDB=='exit') break;   //break out of page loop if page does not exist
            insertSymbols(pageDB);  //DB insert
            pageCounter++;
        }//END page loop 
    }//END letter loop
}//END scrapeTickers

module.exports = scrapeTickers;