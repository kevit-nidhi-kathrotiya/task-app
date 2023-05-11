// file to connect server and  database return mongoose object
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URL,{
    useNewUrlParser: true
});