const dotenv = require("dotenv");
const { builtinModules } = require("module");
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
      const result = await collection.insertOne(obj);
      console.log(`${obj._id} was inserted into the database.`);
    } catch (error) {
      console.log(error, err);
    } finally{
      client.close();
      console.log("MongoDB client closed.");
    }
  });
}

async function existsInDb(symbol) {
  let out = {};
  client.connect(async (err) => {
    
    try {
    console.log('checkingdbcom')
    out = await collection.findOne({ _id: symbol });
    console.log(out)
      
    } finally {
      await client.close();
      console.log(out);
      sendResult(symbol, out);
    }
  });
  client.close();
}

module.exports = writeToDb;
