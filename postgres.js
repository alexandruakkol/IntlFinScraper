const { Client } = require("pg"),
  getBaseTickers = require("./getAllUSTickers");
require("dotenv").config();
mode = "OVERWRITE";
debug = true;
const { user, host, database, password, port } = process.env;
const client = new Client({
  user,
  host,
  database,
  password,
  port,
  ssl:true
});
client.connect(err => {
  if (err) {
    console.error('DB connection error', err.stack)
    throw 'DB connection error'
    ;}
  else console.log('DB connected')
});

return;

function v2arr(arr) {
  //array of objects to array of object values
  const arrval = [];
  arr.forEach((s) => arrval.push(Object.values(s)[0]));
  return arrval;
}

function processData(data) {
  const keys = JSON.stringify(data.map((pair) => pair[0]))
    .replace("[", "")
    .replace("]", "")
    .replace(/['"]+/g, "");
  const values = JSON.stringify(
    data.map((pair) => (isNaN(pair[1]) ? pair[1] : Number(pair[1])))
  )
    .replace("[", "")
    .replace("]", "")
    .replaceAll(`"`, `'`);
  let symbol = data.filter((p) => p[0] == "symbol")[0][1];
  return { keys, values, symbol };
}

async function getTickers() {
  existingSymbols = [];
  client.query(`SELECT symbol from data`, (err, res) => {
    existingSymbols = v2arr(res.rows);
  });
  const baseTickers = await getBaseTickers();
  return {
    tickers: baseTickers.filter((t) => !existingSymbols.includes(t)),
    baseCounter: baseTickers.length,
  };
}

function insertRow(data) {
  const { keys, values, symbol } = processData(data);
  //console.log(`INSERT INTO data(${keys}) values(${values})`);
  client.query(`INSERT INTO data(${keys}) values(${values})`, (err, res) => {
    if (err) {
      console.log("db insert error ", err);
      return;
    }
    console.log("\x1b[32m", symbol, "inserted into DB.", "\x1b[0m");
  });
}

module.exports = { insertRow, getTickers };
