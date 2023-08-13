const asyncHandler = require('express-async-handler');
const User = require('../models/userModel.js');
const generateToken = require('../config/generateToken.js');



const registerUser = async(req,res)=>{

    const  {name, email,password,pic} = req.body;

    if(!name || !email || !password){
        res.status(400);

        throw new Error("please enter all fields");
    }

    const userExist = await User.findOne({email});

    if(userExist){
        res.status(400);

        throw new Error("User Already Exist");
    }
   

    const user = await User.create({
        name, email, password, pic,
    });

    if(user){
        res.status(201).json({
            _id : user._id,
            name:user.name,
            email:user.email,
            pic:user.pic,
            token:generateToken(user._id),
        })

        
    }
    else{
        res.status(400);
        throw new Error("Failed to create the user");
    }
};

const authUser  = async (req,res)=>{
    const {email,password} = req.body;
    const user = await User.findOne({email});

    if(user  && (await user.matchPassword(password)))
    {
        res.json({
            _id : user._id,
            name:user.name,
            email:user.email,
            pic:user.pic,
            token:generateToken(user._id),
        })

    }
    else{
        res.status(400);
        throw new Error("Failed to access the user");
    }
};

// /api/user?search=piyush
const allUsers = async(req,res)=>{
  console.log(req.query.search);
    const keyword = req.query.search?{
        $or:[
            {
                name:{$regex:req.query.search, $options:"i"}
            },
            {
                email:{$regex:req.query.search, $options:"i"}
            },
        ]
    }:{

    };

    const users = await User.find(keyword).find({_id :{$ne:req.user._id}});


    res.send(users);
  
     
}
module.exports = {registerUser,authUser , allUsers};