const express = require("express");
const app = express();
const server = require("http").Server(app);

let userArr = {};
let cometArr = [];
let currentCometPos = [];
let room;
const PORT = process.env.PORT || 4100;

//Generate coments

const io = require('socket.io')(server, {
    cors: {
        origin: '*',
    }
});

const cors = require('cors');
app.use(cors());
app.options('*', cors());
app.use(cors({ origin: 'http://localhost:3000' }));

app.set("view engine", "ejs");
app.use(express.static("public"));

app.get('/userArr', (req, res) => {
    res.send(userArr);
});

app.get('/lol', (req, res) => {
    res.send("done");
});

for (let i = 0; i < 50; i++) {
    currentCometPos.push(
        {
            position: {
                x: (Math.random() - 0.5) * 100,
                y: (Math.random() - 0.5) * 100,
                z: (Math.random() - 0.5) * 100,
            },
            rotation: {
                x: Math.random() * Math.PI,
                y: Math.random() * Math.PI
            }
        }
    )

    cometArr.push(
        {
            position: {
                x: (Math.random() - 0.5) * 100,
                y: (Math.random() - 0.5) * 100,
                z: (Math.random() - 0.5) * 100,
            },
            rotation: {
                x: Math.random() * Math.PI,
                y: Math.random() * Math.PI
            }
        }
    )
}

io.sockets.in(room).emit('comet-position', cometArr);
console.log("SEND")

setInterval(function () {
    cometArr = [];
    for (let i = 0; i < 50; i++) {
        cometArr.push(
            {
                position: {
                    x: (Math.random() - 0.5) * 100,
                    y: (Math.random() - 0.5) * 100,
                    z: (Math.random() - 0.5) * 100,
                },
                rotation: {
                    x: Math.random() * Math.PI,
                    y: Math.random() * Math.PI
                }
            }
        )
    }
}, 25000);


setInterval(function () {
    cometArr = [];
    for (let i = 0; i < 50; i++) {
        cometArr.push(
            {
                position: {
                    x: (Math.random() - 0.5) * 100,
                    y: (Math.random() - 0.5) * 100,
                    z: (Math.random() - 0.5) * 100,
                },
                rotation: {
                    x: Math.random() * Math.PI,
                    y: Math.random() * Math.PI
                }
            }
        )
    }
    io.sockets.in(room).emit('comet-position', cometArr);
    console.log("SEND")
}, 25000);


io.on("connection", socket => {
    console.log("HEHE")
    socket.on("join-room", (roomId, userId) => {
        room = roomId
        socket.join(roomId);

        io.sockets.in(roomId).emit('comet-position', currentCometPos);
        io.sockets.in(roomId).emit('comet-position', cometArr);

        //User Entity
        userArr[userId] = { x: 0, y: 0, z: 0 }

        //Another user joined the room
        socket.broadcast.to(roomId).emit('user-connected', userId)

        socket.on("disconnect", () => {
            socket.broadcast.to(roomId).emit('user-disconnected', userId)
            delete userArr[userId]
        })

        socket.on("movement", (movement, user) => {
            // console.log("movement", movement.x, movement.y, movement.z, movement.user2);
            userArr[user] = movement;
            io.sockets.in(roomId).emit('user-position', userArr);
        })

        socket.on("comet", (cometMov) => {
            currentCometPos = cometMov;
        })

        socket.on("cometPost", (cometMov) => {
            currentCometPos = cometMov;
        })
        
    })
})



server.listen(PORT);