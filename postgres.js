const { Client } = require('pg')
require('dotenv').config();
const {user, host, database, password, port} = process.env
const client = new Client({
  user
  ,host
  ,database
  ,password
  ,port
}) 
client.connect()

function insertRow(data){
  console.log('data',data)
  const keys = JSON.stringify(data.map(pair=>pair[0])).replace('[','').replace(']','').replace(/['"]+/g, '');
  const values = JSON.stringify(data.map(pair=>isNaN(pair[1])?pair[1]:Number(pair[1]))).replace('[','').replace(']','').replaceAll(`"`,`'`);
  console.log(`INSERT INTO data(${keys}) values(${values})`);
  client.query(`INSERT INTO data(${keys}) values(${values})`, (err, res) => {
    console.log(res);
    console.log('db insert error ', err)
    client.end()
   })
}

module.exports = insertRow;