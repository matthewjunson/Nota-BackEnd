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
    db = client.db(process.env.db_name || "Nota"); // Database name: Nota
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
    const now = new Date();
    const note = {
        CreationDate: now,
        ModifiedDate: now,
        Title: req.body.Title,
        Body: req.body.Body,
        Category: req.body.Category || "General", // Default category
        Pinned: req.body.Pinned || false,
        Color: req.body.Color,
    };
    const result = await db.collection(process.env.collection || "Notes Collection").insertOne(note); // Collection name: Notes Collection
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
      .collection(process.env.collection || "Notes Collection")
      .find()
      .sort({ Pinned: -1, ModifiedDate: -1 })
        // sort first by true Pinned state, then by most recent ModifiedDate
      .toArray();
    res.json(notes);
  } catch (error) {
    console.error("Error fetching notes:", error);
    res.status(500).json({ error: "Error fetching notes" });
  }
});

// Update note text by ID
app.put("/api/notes/updateNote/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const now = new Date();

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid note ID" });
    }

    const updatedNote = {
      ModifiedDate: now,
      Title: req.body.Title,
      Body: req.body.Body,
      Category: req.body.Category || "General",
      Color: req.body.Color,
    };

    // Update the document
    const result = await db
        .collection(process.env.collection || "Notes Collection")
        .updateOne({ _id: new ObjectId(id) }, { $set: updatedNote });

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Note not found" });
    }

    res.status(200).json({ message: "Note updated successfully", updatedNote });
  } catch (error) {
    console.error("Error updating note:", error);
    res.status(500).json({ error: "Error updating note" });
  }
});

// Change note Pinned state by ID
app.put("/api/notes/changePinState/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid note ID" });
    }

    const updatedNote = {
      Pinned: req.body.Pinned,
    };

    // Update the document
    const result = await db
        .collection(process.env.collection || "Notes Collection")
        .updateOne({ _id: new ObjectId(id) }, { $set: updatedNote });

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Note not found" });
    }

    res.status(200).json({ message: "Pin state changed successfully", updatedNote });
  } catch (error) {
    console.error("Error changing pin state note:", error);
    res.status(500).json({ error: "Error changing pin state note" });
  }
});

// Delete note by ID
app.delete("/api/notes/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid note ID" });
    }

    // Attempt to delete the document
    const result = await db
        .collection(process.env.collection || "Notes Collection")
        .deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Note not found" });
    }

    res.status(200).json({ message: "Note deleted successfully" });
  } catch (error) {
    console.error("Error deleting note:", error);
    res.status(500).json({ error: "Error deleting note" });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
