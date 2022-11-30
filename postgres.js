const { CURSOR_FLAGS } = require("mongodb");
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

function v2arr(arr) {
  //array of objects to array of object values
  const arrval = [];
  arr.forEach((s) => arrval.push(Object.values(s)[0]));
  return arrval;
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

function stringify(arr){
  return JSON.stringify(arr).replaceAll('[','').replaceAll(']','')
}

function insertRow(data) {
  //console.log(`INSERT INTO data(${keys}) values(${values})`);
  let query = 'BEGIN; ';
  for(cluster of data){
    let keys = stringify(Object.keys(cluster)).replaceAll('"',``), values = stringify(Object.values(cluster)).replaceAll('"',`'`);
    query += `INSERT INTO findata (${keys}) values (${values}); `;
  }
  console.log(query)
  client.query(query + ';COMMIT', (err, _) => {
    if(err) console.log("db insert error ", err);
  });
}

module.exports = { insertRow, getTickers };
