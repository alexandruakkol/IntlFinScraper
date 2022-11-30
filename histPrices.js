const yahooFinance = require('yahoo-finance');

async function getHistPrice(symbol,atEndOfYear){ 
    let from = atEndOfYear + '-11-01', to = atEndOfYear + '-12-31';
    try{
        const res = await yahooFinance.historical({symbol:symbol, from:from, to:to})
        return res[1].close
    } catch(err) {
        return null
    }
}
module.exports={getHistPrice}