const express = require('express');
const mongoose = require('mongoose');
const app = express();
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser')
require('dotenv/config');
const port = process.env.PORT || 3000;

// Routes
const fileRoute = require('./Routes/file');
// const showRoute = require('./Routes/show');
// const downloadRoute = require('./Routes/download');

// Cors 
const corsOptions = {
    origin: process.env.ALLOWED_CLIENTS.split(',')
}

//Defin path for express config 
const publicDirectoryPath = path.join(__dirname, '/public');
const viewsPath = path.join(__dirname, '/views'); //Change express default view directory

app.use(cors(corsOptions))
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(publicDirectoryPath));

app.set('views', viewsPath);
app.set('view engine', 'ejs');

// Routes 
app.use('/file', fileRoute);
// app.use('/files', showRoute);
// app.use('/files/download', downloadRoute);

// Connect To DB
mongoose.connect(process.env.DB_CONNECTION, () => {
    console.log('Database Connected')
});

app.listen(port, () => {
    console.log(`server running at http://localhost:${port}/`);
})