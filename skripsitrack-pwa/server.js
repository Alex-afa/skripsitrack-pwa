// Menjalankan frontend + API di komputer sendiri: npm start  ->  http://localhost:3000
require("dotenv").config();
const express = require("express");
const api = require("./api/index.js");

const app = express();
app.use(api);                      // /api/...
app.use(express.static(__dirname)); // index.html, app.js, dst.
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`SkripsiTrack berjalan di http://localhost:${PORT}`));
