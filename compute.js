function compute(data){
  let mcap = 'N/A', roe='N/A', pe='N/A', ebitdaMg= 'N/A', de = 'N/A', interestRate='N/A'

  const currentAssets = data['Total Current Assets']
      ,totalLiabilities=data['Total Liabilities']
      ,shares=data['Diluted Shares Outstanding']
    ,price=data['Price']
    netIncome=data['Net Income']
  , totalStockEquity=data[`Total Shareholders' Equity`]
    ,dividend=data['']
    ,ebitda=data['EBITDA']
    ,revenues=data['Sales/Revenue']
  , interestExpense=data['Interest Expense']
    ,longtermLiabilities=data['Long-Term Debt']

    if (currentAssets && totalLiabilities && shares && price) {
        netNet = (price / ((currentAssets - totalLiabilities) / shares)).toFixed(2);
      }

    //MCap
    if (price && shares) {
      mcap = price * shares;
    }

    //roe
    if (totalStockEquity && netIncome) {
      roe = (netIncome / totalStockEquity).toFixed(2);
    }

    //pe
    if (mcap && netIncome) {
      pe = (mcap / netIncome).toFixed(2);
    }

    //ebitdaMg
    if (ebitda && revenues) {
      ebitdaMg = (ebitda / revenues).toFixed(2);
    }

    //de
    if (totalLiabilities && totalStockEquity) {
      de = (totalLiabilities / totalStockEquity).toFixed(2);
    }

    //interestRate
    if (interestExpense && longtermLiabilities) {
      interestRate = (interestExpense / longtermLiabilities).toFixed(2);
    }

    data = {...data, mcap, roe, pe, ebitdaMg, de, interestRate }
    console.log(data)
    return data;
}
module.exports = compute;