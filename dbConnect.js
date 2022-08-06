const dotenv = require("dotenv");
const { MongoClient, ServerApiVersion } = require("mongodb");

dotenv.config();

const uri = `mongodb+srv://alex:${process.env.CONNECTIONSTRING}@cluster1.nteevn5.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});
const collection = client.db("findata").collection("last");
console.log("MongoDB client created");

function writeToDb(obj) {
  client.connect(async (err) => {
    console.log("MongoDB connection ok.");
    try {
      await collection.deleteOne({ _id: obj._id });
      const result = await collection.insertOne(obj).then;
      console.log(`${obj._id} was inserted into the database.`);
    } catch (error) {
      console.log(error, err);
    } finally{
      client.close();
      console.log("MongoDB client closed.");
    }
  });
}

async function checkIfExists(symbol) {
  let out = {};
  client.connect(async (err, db) => {
    try {
    out = await collection.findOne({ _id: symbol });
    _db  = client.db('test_db');
    if(out)out=1;
    else out=0
    } finally {
      await client.close();
    }
  });
  client.close();
}

module.exports = {writeToDb, checkIfExists};
