// file to connect server and  database return mongoose object
const mongoose = require('mongoose');

// connect local host
mongoose.connect('mongodb://127.0.0.1:27017/taskapp-api',{
    useNewUrlParser: true
});