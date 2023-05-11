// file to define schema and model for tasks
const mongoose = require('mongoose');

const taskSchema = mongoose.Schema({
    description:{
        type : String,
        required : [true,'Task description required.'],
        trim : true
    },
    
    // task priority number from 1 to 10
    priority:{
        type: Number,
        min: 1,
        max: 10,
        default: 1
    },
    comment:{
        type: String,
        trim: true
    },
    
    //ID of last user who changed the comment
    lastchangedby:{
        type: mongoose.Schema.Types.ObjectId,
    },
    
    //3 status of task - To Do, In Process or Completed,
    status:{
        type : String,
        enum: {values:['To Do', 'In Process', 'Completed'],
            message:'{VALUE} is not supported.'    
        },
        default: 'To Do'
    },
    
    //ID of user who created a task
    assignby:{
        type: mongoose.Schema.Types.ObjectId,
        require: true
    },
    
    //ID of user to whom task is assigned
    assignto:{
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    }
},{timestamps : true});

const Task = mongoose.model('Task',taskSchema);

module.exports = Task;