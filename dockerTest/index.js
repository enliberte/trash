const express = require('express')

const app = express();

app.get('/', (req, res) => {
    res.send("I'm in docker");
});

app.listen(3000, () => {
    console.log("I'am alive");
});