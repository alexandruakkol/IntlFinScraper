function compute(data){
  let mcap = 'N/A', netNet='N/A', roe='N/A', pe='N/A', roce='N/A', de = 'N/A', interestRate='N/A'

  const 
    currentAssets = data['Total Current Assets']
    ,totalLiabilities=data['Total Liabilities']
    ,currentLiabilities=data['Total Current Liabilities']
    ,totalAssets=data['Total Assets']
    ,shares=data['Diluted Shares Outstanding']
    ,price=data['Price']
    ,netIncome=data['Net Income']
    ,totalStockEquity=data[`Total Shareholders' Equity`]
    ,dividend=data['']
    ,ebitda=data['EBITDA']
    ,revenues=data['Sales/Revenue']
    ,interestExpense=data['Interest Expense']
    ,longtermLiabilities=data['Long-Term Debt']
    ,DA=data['Depreciation & Amortization Expense']
    ;

    //netnet
    if (currentAssets && totalLiabilities && shares && price) {
        netNet = (price / ((currentAssets - totalLiabilities) / shares)).toFixed(2);
      }

    //MCap
    if (price && shares) {
      mcap = price * shares;
    }

    //roe
    if (totalStockEquity && netIncome) {
      roe = ((netIncome * 4) / totalStockEquity).toFixed(2);
    }

    //pe
    if (mcap && netIncome) {
      pe = (mcap / (netIncome * 4)).toFixed(2);
    }

    //de
    if (totalLiabilities && totalStockEquity) {
      de = (totalLiabilities / totalStockEquity).toFixed(2);
    }

    //interestRate
    if (interestExpense && longtermLiabilities) {
      interestRate = ((interestExpense * 4) / longtermLiabilities).toFixed(2);
    }

    //roce
    if (totalAssets && currentLiabilities) {
      roce = (((ebitda-DA))*4/(totalAssets-currentLiabilities)).toFixed(2);
    }

    data = {...data, mcap, netNet, roe, roce, pe, de, interestRate }
    return data;
}
module.exports = compute;