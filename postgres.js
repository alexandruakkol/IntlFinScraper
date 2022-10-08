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
  const keys = JSON.stringify(data.map(pair=>pair[0])).replace('[','').replace(']','').replace(/['"]+/g, '');
  const values = JSON.stringify(data.map(pair=>pair[1])).replace('[','').replace(']','');
  console.log('inserting keys', keys, 'values, ',values);
  client.query(`INSERT INTO data(${keys}) values(${values})`, (err, res) => {
    console.log(res)
    client.end()
   })
}

module.exports = insertRow;