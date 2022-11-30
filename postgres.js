const { Client } = require("pg"),
  getBaseTickers = require("./getAllUSTickers"),
  {tempLog}  = require("./logger");
require("dotenv").config();
mode = "OVERWRITE";
debug = false;
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

function v2arr(arr) {
  //array of objects to array of object values
  const arrval = [];
  arr.forEach((s) => arrval.push(Object.values(s)[0]));
  return arrval;
}

async function getTickers() {
  existingSymbols = [];
  client.query(`SELECT symbol from data`, (err, res) => {
    if(err){tempLog.error(`DB select error: ${err}`);return}
    existingSymbols = v2arr(res.rows);
  });
  const baseTickers = await getBaseTickers();
  return {
    tickers: baseTickers.filter((t) => !existingSymbols.includes(t)),
    baseCounter: baseTickers.length,
  };
}

function stringify(arr){
  return JSON.stringify(arr).replaceAll('[','').replaceAll(']','')
}

async function insertRow(data, Symbol) {
  let query = '';
  for(cluster of data){
    let keys = stringify(Object.keys(cluster)).replaceAll('"',``), values = stringify(Object.values(cluster)).replaceAll('"',`'`);
    query += `INSERT INTO findata (${keys}) values (${values}); `;
  }
  try {
    await client.query(query);
    console.log(`${Symbol} ok`)
  } catch (err) { tempLog.error(`${Symbol} DB insert error: ${err}`) }
}

module.exports = { insertRow, getTickers };
