const express = require('express');

const app  = express();
const port = 3000

app.use(express.static(__dirname + '/pubuilc'));
app.get('/', (req, res) =>{
    res.sendFile(__dirname + '/views/companylist.html');
})

app.listen(port, () =>{
    console.log(`Server running on port ${port}`);
})

