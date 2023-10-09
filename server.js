const dotenv = require('dotenv');
dotenv.config({path: './.env'});
// dotenv.config({path: './server/.env'});

const MongoClient = require('mongodb').MongoClient;
const { ObjectId } = require('mongodb');
const uri = `mongodb+srv://ch-user:${process.env.MONGO_PW}@carat-haus.ruaehtd.mongodb.net/?retryWrites=true&w=majority&appName=AtlasApp`

const express = require('express');
const app = express();
const cors = require("cors");
const short = require('short-uuid')

app.use(express.json());
app.use(cors());
// app.use(express.static('public'))

const newClient = async () => {
  const client = new MongoClient(uri)
  try {
      await client.connect()
      const db = client.db('ch-db')
      const collection = db.collection('ch-collection');
      return { client, collection };
  } catch (error) {
      console.log('failed to open connection')
      // console.log(error)
      return null;
  }
}

async function writeDB(newJSON) {
  try {
      const { client, collection } = await newClient()
      let rawID = newJSON._id;
      let id = new ObjectId(rawID);
      delete newJSON._id;
      const updateOperation = {
          $set: newJSON
      };
      let success = await collection.updateOne({_id: id}, updateOperation)

      // await collection.insertOne(newJSON)
      client.close()
      return true
  } catch (err) {
      console.log('failed to write to db')
      return false
  }
}

async function readDB() {
  try {
      const { client, collection } = await newClient()
      const res = await collection.find({}).toArray()
      client.close()
      return res[0];
  } catch (err) {
      console.log('failed to read db')
      return null;
  }
}

app.post('/book', async (req, res) => {
  const { name, number, time, email } = req.body;
  let oldDB = await readDB();
  if (!oldDB) oldDB = {appointments: {}};
  
  const id = short().new();
  oldDB.appointments[id] = {
    name: name,
    number: number,
    timeslot: time,
    email: email
  }

  writeDB(oldDB)
  res.json(oldDB.appointments[id])
});

app.post('/login', async (req, res) => {
  const {name, pw} = req.body;
  if (name !== process.env.ADMINUSER) {
    res.status(500).json({error: 'name'})
  } else if (pw !== process.env.ADMINPW) {
    res.status(500).json({error: 'pw'})
  } else {
    let result = await readDB();
    res.json(result.appointments)
  }
})

app.get('/getBookings', async (req, res) => {
  let result = await readDB();
  res.json(result.appointments)
})

app.post('/deleteBooking', async (req, res) => {
  let id = req.body.id;
  let db = await readDB();

  delete db.appointments[id]

  await writeDB(db)
  res.json(db.appointments)
})

app.listen(process.env.PORT || 4000, () => {
    console.log("server is listen");
});