const express = require('express');
const path = require('path');
const app = express();

// This serves your static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// This is the root route, serving your index.html file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// The server listens on the port provided by Render
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});