const express = require('express');
const dotenv = require("dotenv");
const colors = require('colors');
const chat = require('./data/data');
const connectDB = require('./config/db');

const userRoutes = require('./routes/userRoutes.js');
const chatRoutes = require('./routes/chatRoutes.js');
const messageRoutes = require('./routes/messageRoutes');
const app = express();
const path = require('path');
const {notFound, errorHandler} = require('../backend/middlewares/errorMiddleware.js');

dotenv.config();
connectDB();
app.use(express.json());
app.use('/api/user', userRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/message', messageRoutes);


// ---------------------------------------------------------deployment--------------


const __dirname1 = path.resolve();
if(process.env.NODE_ENV === 'productions')
{
    app.use(express.static(path.join(__dirname1, '/frontend/build')));
    app.get('*', (req,res)=>{
        res.sendFile(path.resolve(__dirname1, "frontend" , "build", "index.html"));
    })
}
else
{
      app.get('/', (req,res)=>{
        res.send("api running successfully");
      })
}


// ---------------------------------------------------------deployment completed --------------






// app.get("/api/chat" , (req,res)=>{
//     res.send(chat);
// })


app.use(notFound);
app.use(errorHandler);


 const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, console.log(`server started at port ${PORT}`.yellow.bold));

const io = require('socket.io')(server,{
    pingTimeout : 60000,
    cors:{
        origin:"https://chatseamlessly.onrender.com/",
    },
});

io.on("connection",(socket)=>{
    console.log("connected to socket.io");
    socket.on('setup', (userData)=>{
        socket.join(userData._id);
      
        socket.emit('connected');
    })

    socket.on('join chat', (room)=>{
        socket.join(room);
        console.log("user joined Room" + room);
    });
    
    socket.on('typing', (room) => socket.in(room).emit("typing"));
    socket.on('stop typing', (room)=> socket.in(room).emit("stop typing"));

    socket.on('new message', (newMessageRecieved)=>{
        var chat = newMessageRecieved.chat;

        if(!chat.users) return console.log('chat.users not defined');

        chat.users.forEach(user=>{
            if(user._id == newMessageRecieved.sender) return;

            socket.in(user._id).emit('message recieved', newMessageRecieved);
        });
    });

    socket.off('setup' , ()=>{
        console.log("User disconnected");
        socket.leave(userData._id);
    })

})