function compute(data) {
  let mcap = null,
    ncavpsppct = null,
    ncavpsppct_fixed = null,
    roepct = null,
    pe = null,
    roce = null,
    depct = null,
    interestRatepct = null;

  const currentAssets = data["Total Current Assets"],
    totalLiabilities = data["Total Liabilities"],
    currentLiabilities = data["Total Current Liabilities"],
    totalAssets = data["Total Assets"],
    shares = data["Diluted Shares Outstanding"],
    price = data["Price"],
    netIncome = data["Net Income"],
    totalStockEquity = data[`Total Shareholders' Equity`],
    dividend = data[""],
    ebitda = data["EBITDA"],
    revenues = data["Sales/Revenue"],
    interestExpense = data["Interest Expense"],
    longtermLiabilities = data["Long-Term Debt"],
    DA = data["Depreciation & Amortization Expense"];
  //ncavpsppct
  if (currentAssets && totalLiabilities && shares && price) {
    ncavpsppct = ((currentAssets - totalLiabilities) / shares / price).toFixed(
      2
    );
  }

  //ncavpsppct_fixed (includes fixed assets, adjusted)
  if (currentAssets && totalAssets && totalLiabilities && shares && price) {
    const ltAssets = totalAssets - currentAssets;
    const adjAssets = currentAssets + 0.33 * ltAssets;
    ncavpsppct_fixed = (
      (adjAssets - totalLiabilities) /
      shares /
      price
    ).toFixed(2);
  }

  //MCap
  if (price && shares) {
    mcap = (price * shares).toFixed(1);
  }

  //roepct
  if (totalStockEquity && netIncome) {
    roepct = ((netIncome * 4) / totalStockEquity).toFixed(2);
  }

  //pe
  if (mcap && netIncome) {
    pe = (mcap / (netIncome * 4)).toFixed(2);
  }

  //de (procentual)
  if (totalLiabilities && totalStockEquity) {
    depct = (totalLiabilities / totalStockEquity).toFixed(2);
  }

  //interestRatepct
  if (interestExpense && longtermLiabilities) {
    interestRatepct = ((interestExpense * 4) / longtermLiabilities).toFixed(2);
  }

  //roce
  if (totalAssets && currentLiabilities) {
    roce = (((ebitda - DA) * 4) / (totalAssets - currentLiabilities)).toFixed(
      2
    );
  }

  data = {
    ...data,
    mcap,
    ncavpsppct,
    ncavpsppct_fixed,
    roepct,
    roce,
    pe,
    depct,
    interestRatepct,
  };
  return data;
}
module.exports = compute;
