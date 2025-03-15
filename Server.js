const express = require('express');
const http = require('http');
const fs = require('fs');
const csv = require('csv-parser')

const app = express();
const server = http.createServer(app);
const PORT = 3000;

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

app.use(express.static(__dirname + '/public'));


//Convert CSV File to Object
var objects = [];

fs.createReadStream('./listedCompanies_th_TH.csv')
  .pipe(
    csv()
  )
  .on('data', (data) => objects.push(Object.values(data)))
  .on('end', () => {
    console.log(objects)
  })

app.get('/',(req, res) =>{
  res.render('companiesList', {data: objects})
})

server.listen(PORT, ()=>{
  console.log(`Server running on port ${PORT}`);
})