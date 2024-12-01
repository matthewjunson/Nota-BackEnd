require("dotenv").config(); 
const express = require("express"); 
const { MongoClient, ObjectId } = require("mongodb"); 
const cors = require("cors"); 

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB setup
const client = new MongoClient(process.env.MONGO_URI);
let db;

// Connect to MongoDB
async function connectToMongo() {
  try {
    await client.connect();
    db = client.db("Nota"); // Database name: Nota
    console.log("Connected to MongoDB - Database: Nota");
  } catch (error) {
    console.error("MongoDB connection error:", error);
  }
}

connectToMongo();

// Routes

// Create a new note
app.post("/api/notes", async (req, res) => {
  try {
    const note = {
      Title: req.body.Title,
      Body: req.body.Body,
      Category: req.body.Category || "General", // Default category
      createdAt: new Date(),
    };

    const result = await db.collection("Notes Collection").insertOne(note); // Collection name: Notes Collection
    res.status(201).json({ _id: result.insertedId, ...note });
  } catch (error) {
    console.error("Error creating note:", error);
    res.status(500).json({ error: "Error creating note" });
  }
});

// Get all notes
app.get("/api/notes", async (req, res) => {
  try {
    const notes = await db
      .collection("Notes Collection")
      .find()
      .sort({ createdAt: -1 }) // Most recent first
      .toArray();
    res.json(notes);
  } catch (error) {
    console.error("Error fetching notes:", error);
    res.status(500).json({ error: "Error fetching notes" });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
