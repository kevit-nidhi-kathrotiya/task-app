const express = require('express');
const User = require('../models/user');
const router = new express.Router();
const auth = require('../middleware/auth'); // funtion to authorize user
const Task = require('../models/task');
const mongoose = require('mongoose');

/**add new user - by default employee otherwise manager*/
//---------------------------
router.post('/users',async (req,res)=>{
    const user = new User(req.body)
    try{
        await user.save();
        const token = await user.generateAuthToken();
        res.status(201).send({user,token});
    }
    catch(e){
        res.status(400).send(e.message);
    }
});

/**login user - if user exists then generate token for session */
router.post('/users/login',async(req,res)=>{
    try{
        const user = await User.findByCredentials(req.body.email,req.body.password);
        const token = await user.generateAuthToken();
        res.send({user,token})
    }catch(e){
        res.status(400).send(e.message);
    }
});

/**logout current session of user - remove current session token */
router.post('/users/logout',auth,async(req,res)=>{
    try{
        req.user.tokens = req.user.tokens.filter((token) =>{
            return token.token !== req.token
        })
        await req.user.save()
        res.send()
    }catch(e){
        res.status(500).send(e.message)
    }
})

/**logout all session of user and remove all session tokens */
router.post('/users/logoutAll',auth,async(req,res)=>{
    try{
        req.user.tokens = [];
        await req.user.save();
        res.send();
    }catch(e){
        res.status(500).send(e.message);
    }
})

/** get filtered and sorted user list as per passsed parameter value
* GET - /users?avgLoad=true  : Manager - can see average load (of priority) wise employee list, Employee - not eligible for this option
* GET - /users?role=manager  : Manager - can see manager list or employee list, Employee - not eligible for this option */
//--------------------------------
router.get('/users',auth,async (req,res)=>{
    let users = {};
    let agg = []; // variable to generate aggregate query to find average work load wise user list
    
    if (req.user.role === 'manager'){
        
        // if manager demanded rolewise i.e. manager or employee wise data then apply filter for it
        if(req.query.role){
            agg = [{
                    '$match': {role : req.query.role}
                    }]
        }
        
        // prepare aggregate query if manager wants to see average work loadwise user list
        if(req.query.avgLoad){ 
            
            agg = [...agg,{
                
                //lookup from tasks using pipeline match assigned to employee id from task with user id to get user information, then calculate
               //average work load by grouping on employee assigned to task,
              
               '$lookup': {
                'from': 'tasks', 
                'let': {
                  'userid': '$_id'
                }, 
                'pipeline': [
                  {
                    '$match': {
                      '$expr': {'$eq': ['$assignto', '$$userid']}
                    }
                  }, {
                    '$group': {
                      '_id': '$assignto', 
                      'avgload': {'$avg': '$priority'}
                    }
                  }
                ], 
                'as': 'result'
              }
            }, {
              '$unwind': {
                'path': '$result'
              }
            }, {
              '$project': {
                '_id': 0, 
                'name': 1, 
                'avgload': '$result.avgload',
                'role': 1, 
                'contactno': 1, 
                'email': 1
              }
            }
        ];         
        }
    }
    try{
        users = await User.aggregate(agg);
        
        // avrage work load is in number value replace it with string to understand easily
        // wrokload is <=4 = Low, >4 & < 8 = Medium , >=8 = High
        if (req.query.avgLoad){
            users.forEach((user) => {
                user.avgload = user.avgload <= 4 ? 'Low' : (user.avgload >= 8 ? 'High' : 'Medium');
            });
        }

        res.send(users);
    
    }catch(e){
        
        res.status(500).send(e.message);
    }
});


/** update user data for given Id
 * magager can updae any user information
 * employee can update it's own data only.
 */
//-------------------------------
router.patch('/users/:_id',auth, async(req,res) => {

    let allowedUpdates = [];
    
    // prepare field list to be allowed to update by manager or manager
    if(req.user.role === 'manager'){
        allowedUpdates = ['name','role','email','password','contactno','address'];
    }
    else{
        if(req.user._id.toString() === req.params._id){
            allowedUpdates = ['name','contactno','address'];
        }
        else{
            return res.status(400).send({'warning' : "can't update others information."})
        }
    }

    // check allowed field lists exists in collection or not   
    const updates = Object.keys(req.body);
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

    if(! isValidOperation){
        return res.status(400).send({'error' :'Invalid updates.'});
    }

    try{
        // findByIdAndUpdate() doesn't support mongoose middleware so updated value manually in document object
        //-----------------------------------------------
        req.user = req.user.role === 'manager' ? await User.findById(req.params._id) : req.user;
        updates.forEach((update) => req.user[update] = req.body[update]);
        await req.user.save();

        res.send(req.user);
    
    }catch(e){

        res.status(500).send(e.message);
    }
});

/**only manager can delete any user or task data*/
router.delete('/users/:_id',auth, async(req,res)=>{
    if(req.user.role === 'employee'){
        return res.status(400).send({'error':'you have no rights for this operation.'});
    }
    try {
        const user = await User.findByIdAndDelete(req.params._id);
        res.send(user);
    } catch (e) {
        res.status(500).send(e.message)
    }
});

module.exports = router;