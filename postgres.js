const { Client } = require("pg"),
  getBaseTickers = require("./getAllUSTickers"),
  tempLog = require("./logger");
require("dotenv").config();
mode = "APPEND-ONLY"; // APPEND-ONLY | OVERWRITE
debug = false;
const { user, host, database, password, port, table } = process.env;
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
  try {
    const res = await client.query(`SELECT symbol from ${table}`)
    existingSymbols = v2arr(res.rows);
  } catch (err) {tempLog.error(`DB select error: ${err}`)}
  const baseTickers = await getBaseTickers();
  return {
    tickers: baseTickers.filter((t) => !existingSymbols.includes(t)),
    baseCounter: baseTickers.length,
  };
}

function stringify(arr){
  return JSON.stringify(arr).replaceAll('[','').replaceAll(']','')
}

async function insertCluster(data, Symbol) {
  let Main = {}; Main.query = '';
  for(cluster of data){
    let keys = stringify(Object.keys(cluster)).replaceAll('"',``), values = stringify(Object.values(cluster)).replaceAll('"',`'`);
    Main.query += `INSERT INTO ${table} (${keys}) values (${values}); `;
  }
  Main.insertRow = async (Symbol) =>{
    try {
      await client.query(Main.query);
      console.log(`${Symbol} ok`)
    } catch (err) { 
      handleDBError(err, Main);
    }}
  Main.insertRow(Symbol);

  function handleDBError(err, Main){
    let match1 = `error: column "`;
    let match2 = `" of relation "${table}" does not exist`;
    if(String(err).includes(match2)){handleMissingColumn(String(err), match1, match2, Main)}
    else tempLog.error(`${Symbol} DB insert error: ${err} ${Main.query}`)
  }

  async function handleMissingColumn(err, match1, match2, Main){
    //auto-add new columns to DB
    let newColumnName = err.replace(match1,'').replace(match2,''); 
    let query = `ALTER TABLE ${table} ADD ${newColumnName} float(1)`;
    try {
      await client.query(query);
      tempLog.newColumn(`${Symbol} ${newColumnName} added to DB`);
    } catch (err) { 
      tempLog.error(`${Symbol} DB new column insert error: ${err}`)
    }
    Main.insertRow(Symbol);
  }
}

async function insertSymbols(data) {
  let query = `INSERT INTO tickers (symbol, sector, link, scrapeDate) VALUES `;
  for(cluster of data){
    query+= `('${cluster.symbol}', '${cluster.sector}', '${cluster.link}', NOW()),`
  }
  query = query.slice(0,-1)
  try {
    await client.query(query);
    console.log(`Inserted new symbol cluster`)
  } catch (err) { 
    console.log('DB insert new symbol error', err)
  }
}

module.exports = { insertCluster, getTickers, insertSymbols };
