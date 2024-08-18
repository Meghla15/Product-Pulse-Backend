const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: [
        "http://localhost:5173",
        "https://productpulse-dc147.web.app",
        "https://productpulse-dc147.firebaseapp.com"
    ]
}));
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wcqculy.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server
    await client.connect();
    console.log("Connected to MongoDB");

    const allCollection = client.db('ProductPulse').collection('allData');

    // Get all data with pagination
    app.get('/allData', async (req, res) => {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10; 
      const skip = (page - 1) * limit;

      try {
        const totalItems = await allCollection.countDocuments(); 
        const totalPages = Math.ceil(totalItems / limit); 

        const items = await allCollection.find()
          .skip(skip)
          .limit(limit)
          .toArray();

        res.json({
          totalItems,
          totalPages,
          currentPage: page,
          items
        });
      } catch (error) {
        console.error("Failed to fetch all data:", error);
        res.status(500).send("Internal Server Error");
      }
    });

    // Search option with pagination
    app.get("/search", async (req, res) => {
      const search = req.query.search || "";
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      let query = {
        product_name: { $regex: search, $options: "i" },
      };

      try {
        const totalItems = await allCollection.countDocuments(query);
        const totalPages = Math.ceil(totalItems / limit); 

        const items = await allCollection.find(query)
          .skip(skip)
          .limit(limit)
          .toArray();

        res.json({
          totalItems,
          totalPages,
          currentPage: page,
          items
        });
      } catch (error) {
        console.error("Failed to search data:", error);
        res.status(500).send("Internal Server Error");
      }
    });

  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
  }
}

run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Server is running');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
