// file to create user schema and define necessary methods or hook on it

const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken')
const Task = require('./task');

//--------------------------------
const userSchema = mongoose.Schema({
    name:{
        type: String,
        required:[true,'user name required.'],
        trim:true
    },
    
    role:{
        type:String,
        enum:{values:['manager','employee'],
            message:'{VALUE} is not supported'
        },
        default: 'employee'
    },
    
    contactno:{
        type: String,
        require: [true,'contact number required.'],
        trim: true,
        validate(value){
            if(! validator.isMobilePhone(value)){
                throw new Error('contactno is invalid');
            }
        }
    },
    
    email:{
        type: String,
        required: [true,'email required.'],
        unique: true,
        trim: true,
        lowercase: true,
        validate(value){
            if(!validator.isEmail(value)){
                throw new Error('Email is invalid');
            }
        }
    },
    
    password:{
        type:String,
        required: [true,'password required.'],
        trim: true,
        minLength: 7,
        validate(value){
            if(value.toLowerCase().includes('password')){
                throw new Error('Password can not contain "password"');
            }
        }
    },
    
    address:{
        type: String,
        trim: true,
    },
    
    //to store tokens generated on login time
    tokens:[{
        token:{
            type:String,
            required: true
        }
    }]
 }, {
    timestamps : true
});

/**generate token for authorization */
userSchema.methods.generateAuthToken = async function(){
    const user = this
    const token = jwt.sign({_id:user._id.toString()}, 'taskapplication');   // generate token

    user.tokens = user.tokens.concat({token}) // append token if user is loggedin from multiple devices
    await user.save()

    return token
 }

/**generate hash password if password is changed - call before save data*/
//---------------------------------------
 userSchema.pre('save',async function (next) {
    const user = this;

    if (user.isModified('password')){
        user.password = await bcrypt.hash(user.password,8);
    }
    next();
 });

 /**find and match email and password to validate user for login */
 userSchema.statics.findByCredentials = async(email,password) =>{
    const user = await User.findOne({email})

    if(!user)
    {
        throw new Error('Unable to login');
    }

    const isMatch = await bcrypt.compare(password, user.password)

    if(!isMatch){
        throw new Error('Unable to login');
    }

    return user;
}
 
/**when user is removed then delete all tasks of that user */
 userSchema.pre('deleteOne',{document: true},async function (next){
    const user = this;
    await Task.deleteMany({assignto: user._id});
    next();
})

/**delete protective data field from response object while pass JSON Data*/
userSchema.methods.toJSON = function() {
    const user = this;
    const userObject = user.toObject();

    delete userObject.password; // password
    delete userObject.tokens;   // tokens

    return userObject;
}

const User = mongoose.model('User',userSchema);
module.exports = User