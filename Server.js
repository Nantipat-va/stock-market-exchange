const express = require('express');
const http = require('http');

const app = express();
const server = http.createServer(app);
const PORT = 3000;

app.use(express.static(__dirname + '/pubilc'));
app.get('/', (req, res) =>{
    res.sendFile(__dirname + '/views/companiesList.html');
})

server.listen(PORT, ()=>{
    console.log(`Server running on port ${PORT}`);
})