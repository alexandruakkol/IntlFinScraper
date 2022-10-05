function compute(data){
  let mcap = 'N/A', ncavpspPct='N/A', ncavpspPct_fixed='N/A', roePct='N/A', pe='N/A', roce='N/A', dePct = 'N/A', interestRatePct='N/A'

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

    //ncavpspPct
    if (currentAssets && totalLiabilities && shares && price) {
        ncavpspPct = (((currentAssets - totalLiabilities) / shares)/price).toFixed(2);
      }

    //ncavpspPct_fixed (includes fixed assets, adjusted)
    if (currentAssets && totalAssets && totalLiabilities && shares && price) {
      const ltAssets = totalAssets - currentAssets;
      const adjAssets = currentAssets + (0.33*ltAssets);
      ncavpspPct_fixed = (((adjAssets - totalLiabilities) / shares)/price).toFixed(2);
    }

    //MCap
    if (price && shares) {
      mcap = price * shares;
    }

    //roePct
    if (totalStockEquity && netIncome) {
      roePct = ((netIncome * 4) / totalStockEquity).toFixed(2);
    }

    //pe
    if (mcap && netIncome) {
      pe = (mcap / (netIncome * 4)).toFixed(2);
    }

    //de (procentual)
    if (totalLiabilities && totalStockEquity) {
      dePct = (totalLiabilities / totalStockEquity).toFixed(2);
    }

    //interestRatePct
    if (interestExpense && longtermLiabilities) {
      interestRatePct = ((interestExpense * 4) / longtermLiabilities).toFixed(2);
    }

    //roce
    if (totalAssets && currentLiabilities) {
      roce = (((ebitda-DA))*4/(totalAssets-currentLiabilities)).toFixed(2);
    }

    data = {...data, mcap, ncavpspPct, ncavpspPct_fixed, roePct, roce, pe, dePct, interestRatePct }
    return data;
}
module.exports = compute;