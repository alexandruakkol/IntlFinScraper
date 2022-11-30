const fetch = require("node-fetch");
const blacklist = ['AAM', 'AAN', 'ACAC', 'ACACU', 'ACACW', 'ACDC', 'ACDCW', 'ACP', 'AACIW']
async function getBaseTickers() {
  var out = undefined;
  await fetch(
    "https://raw.githubusercontent.com/rreichel3/US-Stock-Symbols/main/all/all_tickers.txt"
  )
    .then((res) => res.text())
    .then((data) => {
      out = Array.from(data.split("\n")).filter(x=>!blacklist.includes(x));
    })
    .catch((err) => console.log("US symbols fetch error", err));

  return out;
}

module.exports = getBaseTickers;
