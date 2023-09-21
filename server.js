const express = require('express');
const app = express();
const { Client } = require('pg');
const dotenv = require('dotenv');
const bodyParser = require("body-parser");
const cors = require("cors");
dotenv.config({path: './.env'});

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(cors());
app.use(express.static('public'));

const getClient = () => {
    return new Client({
        user: process.env.PGUSER,
        host: process.env.PGHOST,
        database: process.env.PGDATABASE,
        password: process.env.PGPASSWORD,
        port: process.env.PGPORT,
        ssl: true
    })
};

app.post('/book', async (req, res) => {
  const { name, number, time, email } = req.body;

  try {
    const query = `
      INSERT INTO public.appointments(name, number, timeslot, email)
      VALUES ($1, $2, $3, $4)
      RETURNING *;`;

    const client = getClient();
    await client.connect();
    const result = await client.query(query, [name, number, time, email]);
    await client.end();
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

async function getBookings() {
  try {
    const query = `SELECT * FROM public.appointments;`;
    let client = getClient();
    await client.connect();
    const result = await client.query(query);
    await client.end();
    return {success: true, data: result.rows}
  } catch (err) {
    return {success: false}
  }
}

app.post('/login', async (req, res) => {
  const {name, pw} = req.body;
  if (name !== process.env.ADMINUSER) {
    res.status(500).json({error: 'name'})
  } else if (pw !== process.env.ADMINPW) {
    res.status(500).json({error: 'pw'})
  } else {
    let result = await getBookings();
    if (result.success) {
      res.status(201).json(result.data);
    } else {
      res.status(500).json({error: 'Internal server error'})
    }
  }
})

app.get('/getVid', (req, res) => {
  const videoFilePath = path.join(__dirname, 'carat-haus-vid-short-sm.mp4');
  res.sendFile(videoFilePath);
});

app.get('/getBookings', async (req, res) => {
  let result = await getBookings();
  if (result.success) {
    res.status(201).json(result.data);
  } else {
    res.status(500).json({error: 'Internal server error'})
  }
})

app.post('/deleteBooking', async (req, res) => {
  let id = req.body.id;
  try {
    const deletequery = `
    DELETE FROM public.appointments
    WHERE id = ${id};
    `;
    const retrievequery = `SELECT * FROM public.appointments;`;

    let client = getClient();
    await client.connect();
    await client.query(deletequery);
    const result = await client.query(retrievequery);
    await client.end();
    res.status(201).json(result.rows);
  } catch (err) {
    res.status(500).json({error: 'Internal server error'});
  }
})

app.listen(process.env.PORT || 4000, () => {
    console.log("server is listen");
});