const fetch = require("node-fetch"), fs=require('fs')
const blacklist = getBlacklist();
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
function getBlacklist(){
  const string = fs.readFileSync('./blacklist.txt','utf-8').toString().split("\n")
  let result=[];
  string.forEach(symbol=>result.push(symbol.replace(/(\r\n|\n|\r)/gm,"")));
  return result;
}

module.exports = getBaseTickers;
