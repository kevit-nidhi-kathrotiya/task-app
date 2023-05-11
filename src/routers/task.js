// file to configure task endpoints
const express = require('express')
const Task = require('../models/task')
const auth = require('../middleware/auth')  // user authantication method
const router = new express.Router();
const mongoose = require('mongoose');

/**create new Task for passed employee ID - only manager can create task for employees*/
//--------------------------------
router.post('/tasks/:_empid', auth, async (req,res)=>{  
    try{
        const task = await Task.create({...req.body, 
                                    assignby: req.user._id, 
                                    assignto: new mongoose.Types.ObjectId(req.params._empid)
                                });
        res.status(201).send(task);
    }catch(e){
        res.status(400).send(e.message);
    }
})

/**retrive Tasks data as per loggedin  user role - Manager or Employee
*GET - /tasks          : Manager - can see all tasks default, Employee - can see only his/her tasks default
*GET - /tasks?empid    : Manager - can see selected employee tasks list , Employee - not eligible for this option
*GET - /tasks?priority=high : Manager and Employee both can see priority wise data
*GET - /tasks?minDate=01/05/2023&maxDate=05/05/2023 : Manager and employee both can see given date range wise tasks list
**/
router.get('/tasks',auth,async (req,res)=>{
    let tasks = {};
    let findCondition = {};
    let sortCondition = {createdAt: -1}; // variable to create data for sort() by default descending order by created date wise

    // if priority variable found in query string then store condition for that
    if (req.query.priority){
        sortCondition = {priority : req.query.priority === 'high' ? 1 : -1};
    }
 
    // if minDate ad maxDate is found in query string then store filter for that
    if(req.query.minDate && req.query.maxDate){
        findCondition = {createdAt : {$gte: req.query.minDate, $lte: req.query.maxDate}}
    }

    /**as per logged in user role
    * manager - can access employee wise/all , priority wise, datewise tasks list
    * employee - can access only own data priority wise, datewise list*/
    try{
        if (req.user.role === 'manager'){
            tasks = req.query.empid === undefined ? await Task.find(findCondition).sort(sortCondition) : await Task.find({assignto : req.query.empid, ...findCondition}).sort(sortCondition);
        }else{
            tasks = await Task.findOne({assignto : req.user._id, ...findCondition}).sort(sortCondition);
        }
        res.send(tasks);
    }catch(e){
        res.status(500).send(e.message);
    }
});

/** user can update task data as per user role
 * manager - can update all fields of any tasks
 * employee - can update only 'status' and 'comment' fields of tasks assigned to him
 */
router.patch('/tasks/:id',auth,async(req,res) =>{
    
    const updates = Object.keys(req.body);
    let allowedUpdates= [];
    
    // List out the fields which can be allowed to update by user as per role
    if(req.user.role === 'manager'){
        allowedUpdates = ['description','priority','status','comment'];
    }else{
        allowedUpdates = ['status','comment'];
    }

    // check if given fields are exists in allowed fields list or not
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));
    
    if(!isValidOperation){
        return res.status(400).send({'Error':'Invalid Updates!'});
    }
    
    let task = {};
    try{
        if(req.user.role === 'manager'){
            task = await Task.findOne({_id: req.params.id});
        }else{
            task = await Task.findOne({_id: req.params.id, assignto: req.user._id});
        }
        
        if(!task){
            return res.status(404).send();
        }

        //FindByIdandUpdate() doesn't support mongoose middleware so have to update value manually
        updates.forEach((update) => task[update] = req.body[update]);
        
        // if task modified then change lastchangedby field with current user's id.
        if(task.isModified()){
            task.lastchangedby = req.user._id;
        }

        task.save(req);

        res.send(task);
    }
    catch(e){
        res.status(500).send(e.message);
    }
});

/** Delete Task - only manager can delete */
router.delete('/tasks/:_id',auth,async (req,res)=>{
    try{
        let task = {};
        
        if (req.user.role === 'manager'){
            task = await Task.findByIdAndDelete({_id:req.params._id});
        }else{
            return res.status(400).send({'Error' : 'You are not eligible for this operation.'})
        }
        
        res.send(task);
    
    }catch(e){
        
        res.status(500).send(e.message);
    }
})

module.exports = router;