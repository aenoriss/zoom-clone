const express = require("express");
const app = express();
const server = require("http").Server(app);

let userArr = {};
let cometArr = [];
let comeTar = []

//Generate coments



console.log("cometArr", cometArr)



const io = require('socket.io')(server, {
    cors: {
        origin: '*',
    }
});

const { v4: uuidV4 } = require("uuid")

const cors = require('cors');
app.use(cors());
app.options('*', cors());
app.use(cors({ origin: 'http://localhost:3000' }));

app.set("view engine", "ejs");
app.use(express.static("public"));

app.get('/userArr', (req, res) => {
    res.send(userArr);
});

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

setInterval(function() {
    for (let i = 0; i < 50; i++) {
        comeTar.push(
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
  }, 15000);

io.on("connection", socket => {
    console.log("HEHE")
    socket.on("join-room", (roomId, userId) => {
        console.log(roomId, userId);
        socket.join(roomId)


        //User Entity
        userArr[userId] = { x: 0, y: 0, z: 0 }
        console.log(userArr)

        //Another user joined the room
        socket.broadcast.to(roomId).emit('user-connected', userId)

        socket.on("disconnect", () => {
            socket.broadcast.to(roomId).emit('user-disconnected', userId)
            console.log("pre", userArr)
            delete userArr[userId]
            console.log("after", userArr)
        })

        socket.on("movement", (movement, user) => {
            // console.log("movement", movement.x, movement.y, movement.z, movement.user2);
            userArr[user] = movement;
            io.sockets.in(roomId).emit('user-position', userArr);
        })

        socket.on("comet-movement", () => {
            io.sockets.in(roomId).emit('comet-position', comeTar);
        })
    })
})


server.listen(4100);