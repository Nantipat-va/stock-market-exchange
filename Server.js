const express = require('express');
const http = require('http');
const fs = require('fs');
const csv = require('csv-parser')
const mysql = require('mysql2');

const app = express();
const server = http.createServer(app);
const PORT = 3000;

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

app.use(express.static(__dirname + '/public'));
app.use(express.json());

// create database connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "stock_market"
})

db.connect((error) => {
  if(error){
    console.log(error)
  }else{
    console.log('database connected')
  }
})

//Convert CSV File to Object
async function loadCSV(){
  let objects = [];

  return new Promise((resolve, reject) =>{
    fs.createReadStream('./listedCompanies_th_TH.csv')
    .pipe(csv({header: false}))
    .on('data', (data) => {
      const values = (Object.values(data));
      let row = {
        postcode: values[0],
        stock: values[1],
        name: values[2],
        market: values[3],
        industry: values[4],
        category: values[5],
        address: values[6],
        tel: values[7],
        fax: values[8],
        website: values[9]
      }
      objects.push(row)
    })
    .on('end', () => {
      console.log(objects)
      console.log("CSV loaded:", objects.length, "row");
      resolve(objects);
    })
    .on("error", (err) => reject(err));
  })
}
//await loadCSV and run server
(async () => {
  try {
    objects = await loadCSV();
    console.log("Data ready to use");

    server.listen(PORT, ()=>{
      console.log(`Server running on port ${PORT}`);
    })

  } catch (err) {
    console.error("Error loading CSV:", err);
  }
})();

app.get('/',(req, res) =>{
  if (objects.length === 0 ) {
    console.log("Warning: ไม่มีข้อมูลใน objects!");
  }
  res.render('companiesList', {data: objects})
})


// Insert data to database
app.post('/api/insert',(req, res) =>{
  let {category_name} = req.body;
  let query = "INSERT INTO category(category_name) VALUES(?)";

  db.query(query, [category_name], (err, results) => {
    if(err){
      console.error("Error");
      return res.status(500).json({errro: "Internal server error"});
    }
    res.json({msg: "insert successfully", insertedId: results.insertId})
  })
})

