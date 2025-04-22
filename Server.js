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
      // console.log(objects)
      console.log("CSV loaded:", objects.length, "row");
      resolve(objects);
    })
    .on("error", (err) => reject(err));
  })
}

async function getOrInsertId(table, column, value) {
  return new Promise((resolve, reject) => {
    db.query(`SELECT ${table}_id AS id FROM ${table} WHERE ${column} = ?`, [value], (err, results) => {
      if (err) return reject(err);
      if (results.length > 0) return resolve(results[0].id);

      db.query(`INSERT INTO ${table} (${column}) VALUES (?)`, [value], (err, insertResult) => {
        if (err) return reject(err);
        resolve(insertResult.insertId);
      });
    });
  });
}

app.post('/api/insert-all', async (req, res) => {
  try {
    for (const company of objects) {
      const market_id = await getOrInsertId('market', 'market_name', company.market);
      const industry_group_id = await getOrInsertId('industry_group', 'industry_name', company.industry);
      const category_id = await getOrInsertId('category', 'category_name', company.category);

      db.query(`
        INSERT INTO company (stock, name, address, postcode, tel, fax, website, industry_group_id, category_id, market_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        [
          company.stock,
          company.name,
          company.address,
          company.postcode,
          company.tel,
          company.fax,
          company.website,
          industry_group_id,
          category_id,
          market_id
        ],
        (err) => {
          if (err) console.error("Insert error for", company.stock, ":", err);
        }
      );
    }
    res.json({ message: "All companies inserted successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Insert failed', error: err.message });
  }
});

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

