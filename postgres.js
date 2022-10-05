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

client.query('INSERT INTO data values(45)', (err, res) => {
  console.log(res.rows[0])
  client.end()
})

//module.exports=insertRow;