require('./db/mongoose')  // load file to conect with database
const express = require('express')  
const app = express()

const userRouter = require('./routers/user')
const taskRouter = require('./routers/task')

const port = process.env.PORT || 3000

app.use(express.json())     // parse json into object
app.use(userRouter);        // register user endpoints
app.use(taskRouter);        // register task endpoints

app.listen(port,()=>{
    console.log('server is up on port ' + port)
});