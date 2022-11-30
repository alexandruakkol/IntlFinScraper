function compute(allData) {
  let result=[];

  let years = allData.map(function(o) { if(!o.Year.includes('-')) return o.Year*1 });
  years = years.filter(y=>typeof y != 'undefined');
  let maxYear = Math.max.apply(Math,years)

  for(data of allData){
    let isAnnual = false, isLastYear;
    if(data.Timeframe=='A')isAnnual=true;
    if(data.Year == maxYear)isLastYear=true; //only calc certain metrics for last year (upd price)

    let Mcap = null,
      Ncavpsppct = null,
      Ncavpsppct_fixed = null,
      Roepct = null,
      Pe = null,
      Roce = null,
      Depct = null,
      InterestRatepct = null;

    const currentAssets = data["TotalCurrentAssets"],
      totalLiabilities = data["TotalLiabilities"],
      currentLiabilities = data["TotalCurrentLiabilities"],
      totalAssets = data["TotalAssets"],
      shares = data["DilutedSharesOutstanding"],
      price = data["Price"],
      netIncome = isAnnual ? data["NetIncome"] : data["NetIncome"]*4,
      totalStockEquity = data[`TotalShareholdersEquity`],
      ebitda = data["EBITDA"],
      interestExpense = isAnnual ? data["InterestExpense"] : data["InterestExpense"]*4,
      longTermDebt = data["LongTermDebt"],
      DA = data["DepreciationAmortizationExpense"];

    //Ncavpsppct
    if (currentAssets && totalLiabilities && shares && price && (isLastYear || !isAnnual)) {
      Ncavpsppct = ((currentAssets - totalLiabilities) / shares / price).toFixed(2)*1;
    }

    //Ncavpsppct_fixed (includes fixed assets, adjusted)
    if (currentAssets && totalAssets && totalLiabilities && shares && price && (isLastYear || !isAnnual)) {
      const ltAssets = totalAssets - currentAssets;
      const adjAssets = currentAssets + 0.33 * ltAssets;
      Ncavpsppct_fixed = ( (adjAssets - totalLiabilities) / shares / price).toFixed(2)*1;
    }

    //Mcap
    if (price && shares && (isLastYear || !isAnnual)) {
      Mcap = (price * shares).toFixed(0)*1;
    }

    //Roepct
    if (totalStockEquity && netIncome) {
      Roepct = (netIncome / totalStockEquity).toFixed(2)*1;
    }

    //pe
    if (Mcap && netIncome && (isLastYear || !isAnnual)) {
      Pe = (Mcap / netIncome).toFixed(2)*1;
    }

    //de (procentual)
    if (longTermDebt && totalStockEquity && (isLastYear || !isAnnual)) {
      Depct = (longTermDebt / totalStockEquity).toFixed(2)*1;
    }

    //InterestRatepct
    if (interestExpense && longTermDebt && (isLastYear || !isAnnual)) {
      InterestRatepct = (interestExpense / longTermDebt).toFixed(2)*1;
    }

    //roce
    if (totalAssets && currentLiabilities && (isLastYear || !isAnnual)) {
      let ebit = isAnnual ? (ebitda - DA) : (ebitda - DA)*4
      Roce = (ebit / (totalAssets - currentLiabilities)).toFixed(2)*1;
    }

    result.push({
      ...data,
      Mcap,
      Ncavpsppct,
      Ncavpsppct_fixed,
      Roepct,
      Roce,
      Pe,
      Depct,
      InterestRatepct,
    });
  }
  return result;
}
module.exports = compute;
