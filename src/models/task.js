// file to define schema and model for tasks
const mongoose = require('mongoose'); // mongoose object to define schema and model for tasks

/** schema for task
 * description : Task Description
 * priority : task priority
 * comment : comment on task activity
 * lastchangedby : ID of last user who changed the comment
 * status : 3 status of task - To Do, In Process or Completed,
 * assignby: ID of user who created a task
 * assignto: ID of user to whom task is assigned
 * */ 
const taskSchema = mongoose.Schema({
    description:{
        type : String,
        required : [true,'Task description required.'],
        trim : true
    },
    priority:{
        type: Number,
        default: 1
    },
    comment:{
        type: String,
        trim: true
    },
    lastchangedby:{
        type: mongoose.Schema.Types.ObjectId,
    },
    status:{
        type : String,
        enum: {values:['To Do', 'In Process', 'Completed'],
            message:'{VALUE} is not supported.'    
        },
        default: 'To Do'
    },
    assignby:{
        type: mongoose.Schema.Types.ObjectId,
        require: true
    },
    assignto:{
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    }
},{timestamps : true});

const Task = mongoose.model('Task',taskSchema);   // define Task model from schema

module.exports = Task;