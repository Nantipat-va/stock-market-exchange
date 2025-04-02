const express = require('express');
const http = require('http');
const axios = require('axios');
const fs = require('fs');
const XLSX = require('xlsx');
const iconv = require('iconv-lite');

const app = express();
const server = http.createServer(app);
const PORT = 3000;

app.use(express.static(__dirname + '/pubilc'));

const downloadExcelFile = async (url, filePath) => {
    const response = await axios({
        method: 'get',
        url: url,
        responseType: 'arraybuffer' // Important to get the file in binary format
    });
    
    // Save the file locally
    fs.writeFileSync(filePath, response.data);
    console.log('File downloaded successfully!');
}

// Function to convert Excel to CSV
const convertExcelToCSV = (inputFilePath, outputFilePath) => {
   
    const xlsData = fs.readFileSync(inputFilePath);

    // If the file is encoded in a non-UTF-8 encoding like Windows-1252, decode it first
    const decodedData = iconv.decode(xlsData, 'windows-874');  // Adjust encoding if needed

    // Parse the XLSX file
    const workbook = XLSX.read(decodedData, { type: 'string' });

    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Convert the sheet to CSV
    const csvData = XLSX.utils.sheet_to_csv(sheet);

    // Save the CSV data to a file
    fs.writeFileSync(outputFilePath, csvData);
    console.log('Excel file converted to CSV!');
}



// Main execution
(async () => {
    const url = 'https://weblink.set.or.th/dat/eod/listedcompany/static/listedCompanies_th_TH.xls'; // Replace with the URL of your Excel file
    const inputFilePath = 'listedCompanies_th_TH.xls'; // Path where the file will be saved temporarily
    const outputFilePath = 'listedCompanies_th_TH.csv'; // Path for the output CSV file

    // Download the Excel file
    await downloadExcelFile(url, inputFilePath);

    // Convert the downloaded Excel file to CSV
    convertExcelToCSV(inputFilePath, outputFilePath);
})();