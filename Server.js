const express = require('express');
const http = require('http');
const fs = require('fs');
const csv = require('csv-parser')
const mysql = require('mysql2');

const app = express();
const server = http.createServer(app);
const PORT = 5000;

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

//====================================================================================================
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
      let market_id = await getOrInsertId('market', 'market_name', company.market);
      let industry_group_id = await getOrInsertId('industry_group', 'industry_name', company.industry);
      let category_id = await getOrInsertId('category', 'category_name', company.category);

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
    res.json({ message: "inserted successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Insert failed', error: err.message });
  }
});

//====================================================================================================
const scrap = require('./public/JS/scrap')

app.get('/price', async (req, res) => {

  const url = 'https://www.set.or.th/th/market/product/stock/quote/CPALL/price'
  selectors = []
  selectors.push("#stock-quote-tab-pane-1 > div > div.price-info-stock.site-container.mb-4 > div > div.d-flex.flex-column.col > div.mb-2 > div > div.card-minimal-body > div.cost-detail.d-flex.flex-column.border-bottom.border-1.py-1.px-3 > div:nth-child(3) > div.item-list-details.d-flex.flex-column.price-info-stock-detail.col-5.me-auto > span")
  selectors.push("#stock-quote-tab-pane-1 > div > div.price-info-stock.site-container.mb-4 > div > div.d-flex.flex-column.col > div.mb-2 > div > div.card-minimal-body > div.cost-detail.d-flex.flex-column.border-bottom.border-1.py-1.px-3 > div:nth-child(3) > div:nth-child(2) > span")
  const result = await scrap(url, selectors)

  if (result.status === 200) {
      const text = result.message.join(', ')
      // const text = result.message
      res.render('price', {price: text});
  }else{
      res.status(400).send(result.message)
  }
});

app.get('/holders', async (req, res) => {

  const url = 'https://www.set.or.th/th/market/product/stock/quote/CPALL/major-shareholders'
  // const url = 'https://wattanapong.com'
  selectors = []
  selectors.push(".table.b-table.table-custom-field.table-custom-field--cnc.table-hover-underline.b-table-no-border-collapse  > tbody") // > tr:nth-child(1)
  // selectors.push('tbody[role="rowgroup"]')

  const result = await scrap(url, selectors)

  if (result.status === 200) {
    let text = "";
    result.message.forEach(element => {
        text += element.trim();
    });

  //convert string to array
  const textConvert = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

  //split data in array 4 for a group
  let holders =[];
  for(let i = 0; i < textConvert.length; i += 4){
    holders.push({
      rank: textConvert[i],
      name: textConvert[i + 1],
      shares: textConvert[i + 2],
      percent: textConvert[i + 3]
    });
  }

  res.render('holders', {holders});
  } else{
    res.status(400).send({result:message});
  }
});
//====================================================================================================

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

//====================================================================================================
app.get('/',(req, res) =>{
  if (objects.length === 0 ) {
    console.log("Warning: No data in objects!");
  }
  res.render('companiesList', {data: objects});
})

