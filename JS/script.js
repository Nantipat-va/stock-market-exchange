const axios = require("axios");
const xlsx = require("xlsx");
const mysql = require("mysql2/promise");
const fs = require("fs");

const url = "https://www.set.or.th/dat/eod/listedcompany/static/listedCompanies_th_TH.xls";
const filepath = "listedCompanies.xls";

const db = {
    host: "localhost",
    user: "root",
    password: "",
    database: "listed_conpanies",
};

// โหลด Excel จากเว็บ มาเก็บไว้
async function downloadFile() {
    console.log("Downloading...");
    const response = await axios({
        method: 'GET',
        url: url,
        responseType: "arraybuffer",
    });

    fs.writeFileSync(filepath, response.data);
    console.log("Download Successfully");
}

// แปลงไฟล์Excel
function parseExcel(){
    console.log("Converting data from Excel");
    const workbook = xlsx.readFile(filepath);
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], {defval: ""});

    console.log(data[0]);
    console.log(`Found data ${data.length}`);
    return data;
}

// Insert Excel ลง database
async function insert(data) {
    const connection = await mysql.createConnection(db);
    console.log("Database Connected");


    const query = `INSERT INTO companies(Estate, Companie, Market, Industry_group, Business_category, Address, Post_id, tel, fax, Website) VALUES(?,?,?,?,?,?,?,?,?,?)`;

    try {
        for (const row of data){
            const values =[
                row["Estate"]?.trim() || "N/A",
                row["Companie"]?.trim() || "N/A",
                row["Market"]?.trim() || "N/A",
                row["Industry_group"]?.trim() || "N/A",
                row["Business_category"] || null,
                row["Address"]?.trim() || "N/A",
                row["Post_id"] || null,
                row["tel"] || null,
                row["fax"] || null,
                row["Website"] || null,
            ];
            
            await connection.execute(query, values);
        }
        console.log('INSERT Successfullly');
    }catch (error){
        console.error('INSERT Failed', error);
    }finally{
        await connection.end();
    }
}

// เรียกใช้function
async function main(){
    await downloadFile();
    const data = parseExcel();
    await insert(data);
}

main().catch(console.error);
