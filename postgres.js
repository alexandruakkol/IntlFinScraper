const { Client } = require("pg");
require("dotenv").config();
const { user, host, database, password, port } = process.env;
const client = new Client({
  user,
  host,
  database,
  password,
  port,
});
client.connect();
console.log("DB client open");

function insertRow(data) {
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
  //console.log(`INSERT INTO data(${keys}) values(${values})`);
  client.query(`INSERT INTO data(${keys}) values(${values})`, (err, res) => {
    let symbol = data.filter((p) => p[0] == "symbol");
    console.log(symbol[0][1], "written to DB");
    if (err) console.log("db insert error ", err);
  });
}

module.exports = insertRow;
