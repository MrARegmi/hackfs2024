const express = require("express");
const fileUpload = require("express-fileupload");
const bodyParser = require("body-parser");
const dataController = require("./src/controllers/dataController");

const app = express();

app.use(bodyParser.json());
app.use(fileUpload());

// Endpoint to receive JSON data, hash, and log file from the frontend
app.post("/upload", dataController.uploadData);

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
