const express = require('express');
const fs = require('fs').promises;
const short = require('short-uuid')
const app = express();
const dotenv = require('dotenv');
const bodyParser = require("body-parser");
const cors = require("cors");
dotenv.config({path: './.env'});

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(cors());
app.use(express.static('public'));

const readDB = async () => {
  let read = await fs.readFile('db.json', 'utf8')
  return JSON.parse(read)
}

const writeDB = async (newDB) => {
  await fs.writeFile('db.json', JSON.stringify(newDB), 'utf8')
  return true
}

app.post('/book', async (req, res) => {
  const { name, number, time, email } = req.body;
  let oldDB = await readDB();
  if (!oldDB) oldDB = {};

  const id = short().new();
  oldDB[id] = {
    name: name,
    number: number,
    timeslot: time,
    email: email
  }
  
  res.json(oldDB[id])
  writeDB(oldDB)
});

app.post('/login', async (req, res) => {
  const {name, pw} = req.body;
  if (name !== process.env.ADMINUSER) {
    res.status(500).json({error: 'name'})
  } else if (pw !== process.env.ADMINPW) {
    res.status(500).json({error: 'pw'})
  } else {
    let result = await readDB();
    res.json(result)
  }
})

app.get('/getBookings', async (req, res) => {
  let result = await readDB();
  res.json(result)
})

app.post('/deleteBooking', async (req, res) => {
  let id = req.body.id;
  let db = await readDB();

  delete db[id]

  await writeDB(db)
  res.json(db)
})

app.listen(process.env.PORT || 4000, () => {
    console.log("server is listen");
});