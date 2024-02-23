const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const faceapi = require("face-api.js");

const app = express();
const PORT = process.env.PORT || 4000;

// Enable CORS
app.use(cors());

// MongoDB connection
mongoose.connect(
  process.env.KEY,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

// Define the schema for face data
const faceSchema = new mongoose.Schema({
  descriptor: Array,
  scores: Array,
});

const Face = mongoose.model("Face", faceSchema);

// Configure face-api.js
faceapi.env.monkeyPatch({ fetch: require("node-fetch") });

app.use(bodyParser.json());

// Calculate Euclidean distance between two arrays of numbers
function euclideanDistance(arr1, arr2) {
  return Math.sqrt(arr1.reduce((sum, val, i) => sum + (val - arr2[i]) ** 2, 0));
}

// Endpoint to handle face detection
app.get("/test", async (req, res) => {
  const htmlContent = `
  <html>
    <head>
      <title>Face Detection Page</title>
    </head>
    <body>
      <h1>Welcome to the face detection page!</h1>
      <p>This is your face detection page content.</p>
    </body>
  </html>
`;
  res.send(htmlContent);
});
app.post("/detectFace", async (req, res) => {
  try {
    const { descriptor, scores } = req.body;
    console.log(descriptor, scores);

    // Fetch all faces from the database
    const databaseFaces = await Face.find(
      {},
      { _id: 0, descriptor: 1, scores: 1 }
    );

    // Replace this logic with your own matching logic
    const matchingFace = findMatchingFace(descriptor, databaseFaces);

    if (matchingFace) {
      // Matching face found, return scores to the frontend
      console.log("Matching Face:", matchingFace);
      res.status(200).json({ message: "match", scores: matchingFace.scores });
    } else {
      res.status(200).json({ message: "no match" });
      const newFace = new Face({
        descriptor,
        scores, // Assuming scores is an array provided by the frontend
      });

      await newFace.save();
      console.log("New Face added to the database:", newFace);
      res.status(200).json({
        message: "New face added to the database!",
        scores: newFace.scores,
      });
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Function to find a matching face based on Euclidean distance
function findMatchingFace(givenDescriptor, databaseFaces) {
  let threshold = 0.5;

  for (const face of databaseFaces) {
    const distance = euclideanDistance(givenDescriptor, face.descriptor);

    if (distance < threshold) {
      return face;
    }
  }

  return null;
}

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
