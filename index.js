const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
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
    // Connect the client to the server (optional starting in v4.7)
    await client.connect();

    const allCollection = client.db('ProductPulse').collection('allData');

    // Get all data with pagination
    app.get('/allData', async (req, res) => {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10; 
      const skip = (page - 1) * limit;

      try {
        const totalItems = await allCollection.countDocuments(); // Get total number of items
        const totalPages = Math.ceil(totalItems / limit); // Calculate total pages

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

    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Server is running');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
