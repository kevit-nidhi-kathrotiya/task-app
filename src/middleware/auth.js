// contains only user authenticate function
const jwt = require('jsonwebtoken');
const User = require('../models/user');

/** check weather user is authanticated to perform a task for given endpoint.
 *  this method can be called before any endpoint operation to validate user
 *  match token and User id stored in header with database value
 *  if user found then save user and token value in request parameter
 * */
const auth = async(req,res,next) =>{
    try{
        const token = req.header('Authorization').replace('Bearer ','');    //fetch token stored in request header
        const decoded = jwt.verify(token,'taskapplication');       // decode token to get user id
        const user = await User.findOne({_id: decoded._id, 'tokens.token':token }); //find user having same token stored in header variable

        if(!user){
            throw new Error();
        }

        // user found then save user and token in request parameter
        req.user = user;
        req.token = token;

        next();
    }catch(e){
        res.status(401).send({error : "please, authanticate."})
    }

};

module.exports = auth;