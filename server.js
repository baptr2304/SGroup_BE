const express = require('express');
const bodyParser = require('body-parser');
const port = process.env.PORT || 8001;
const app = express();
const user_router = require('./routes/user.router');

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }));
app.use('/', user_router);

app.listen(port, function() {
    console.log("listening on port: ", port);
    }
);
