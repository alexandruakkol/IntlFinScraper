const fetch = require("node-fetch");
var myHeaders = {
  apikey: "x9tc1b9NvKsNPz3yCs4a8JIK8TcoN0jm",
};

var requestOptions = {
  method: "GET",
  redirect: "follow",
  headers: myHeaders,
};

fetch(
  "https://api.apilayer.com/exchangerates_data/latest?symbols=EUR,CAD&base=USD",
  requestOptions
)
  .then((response) => response.text())
  .then((result) => console.log(result))
  .catch((error) => console.log("error", error));
