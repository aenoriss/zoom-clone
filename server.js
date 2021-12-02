const THREE = require("three");

const express = require("express");
const app = express();
const server = require("http").Server(app);
const multer  = require('multer')
const upload = multer({ dest: 'uploads/' })

let userArr = {};
let portalArr = [];
let cometArr = [];
let currentCometPos = [];
let portalNum = 0;
let room;
// const PORT = process.env.PORT || 4100;
const PORT = 4100;

//Generate coments

const io = require('socket.io')(server, {
    cors: {
        origin: '*',
    }
});

const cors = require('cors');
app.use(cors());
app.options('*', cors());
app.use(cors({ origin: "*" }));
app.use(express.json())

app.set("view engine", "ejs");
app.use(express.static("public"));

app.get('/userArr', (req, res) => {
    res.send(userArr);
});

app.get('/portalArr', (req, res) => {
    res.send(portalArr);
});

app.get('/lol', (req, res) => {
    res.send("done");
});

app.post('/portalCreation', (req, res) => {
    let data = req.body;
    if (portalArr.length > 0) {
        portalNum = portalNum + 1
        data.portal.id = "portal" + portalNum;
    } else {
        data.portal.id = "portal" + portalNum;
    }

    portalArr.push(data.portal);
    console.log("see this", { portal: data.portal, array: portalArr, type: "create" })
    userArr[data.user].score = userArr[data.user].score - 3
    io.sockets.in(room).emit('portal-spawn', { portal: data.portal, array: portalArr, type: "create" });
    res.send()

});

for (let i = 0; i < 50; i++) {
    currentCometPos.push(
        {
            position: new THREE.Vector3((Math.random() - 0.5) * 100, (Math.random() - 0.5) * 100, (Math.random() - 0.5) * 100),
            rotation: {
                x: Math.random() * Math.PI,
                y: Math.random() * Math.PI
            }
        }
    )

    cometArr.push(
        {
            position: new THREE.Vector3((Math.random() - 0.5) * 100, (Math.random() - 0.5) * 100, (Math.random() - 0.5) * 100),
            rotation: {
                x: Math.random() * Math.PI,
                y: Math.random() * Math.PI
            }
        }
    )
}

setInterval(function () {
    cometArr = [];
    for (let i = 0; i < 50; i++) {
        cometArr.push(
            {
                position: new THREE.Vector3((Math.random() - 0.5) * 100, (Math.random() - 0.5) * 100, (Math.random() - 0.5) * 100),
                rotation: {
                    x: Math.random() * Math.PI,
                    y: Math.random() * Math.PI
                }
            }
        )
    }
}, 25000);


setInterval(function () {
    currentCometPos.forEach((comet, x) => {
        comet.position.lerp(cometArr[x].position, 0.0005)
        for (const prop in userArr) {
            if (userArr[prop].position.distanceTo(currentCometPos[x].position) < 1) {
                currentCometPos[x].position = new THREE.Vector3((Math.random() - 0.5) * 100, (Math.random() - 0.5) * 100, (Math.random() - 0.5) * 100)
                userArr[prop].score = userArr[prop].score + 1;
                console.log(userArr[prop].score)
                io.sockets.in(room).emit('eating-sound', { id: prop, score: userArr[prop].score })
            }
        }
    })



    io.sockets.in(room).emit('comet-position', currentCometPos);
}, 17);

//Decaying
setInterval(function () {
    portalArr.forEach((portal, i) => {
        portal.energy -= 1;
        io.sockets.in(room).emit('portal-update', portalArr);
        if (portal.energy <= 0) {
            portalArr.splice(i, 1)
            io.sockets.in(room).emit('portal-spawn', { array: portalArr, portal, type: "delete" });
        }
    })
}, 1000);

// io.sockets.in(room).emit('comet-position', cometArr);
// console.log("SEND")

io.on("connection", socket => {
    console.log("HEHE")
    socket.on("join-room", (roomId, userId) => {
        room = roomId
        socket.join(roomId);

        // io.sockets.in(roomId).emit('comet-position', currentCometPos);
        // io.sockets.in(roomId).emit('comet-position', cometArr);

        //User Entity
        userArr[userId] = {
            position: new THREE.Vector3(0, 0, 0),
            score: 0,
        }

        //Another user joined the room
        socket.broadcast.to(roomId).emit('user-connected', userId)
        socket.broadcast.to(roomId).emit('portal-pop', portalArr)

        socket.on("disconnect", () => {
            socket.broadcast.to(roomId).emit('user-disconnected', userId)
            delete userArr[userId]
        })

        socket.on("movement", (movement, user) => {
            // console.log("movement", movement.x, movement.y, movement.z, movement.user2);
            userArr[user].position = new THREE.Vector3(movement.x, movement.y, movement.z);
            io.sockets.in(roomId).emit('user-position', userArr);
        })

        socket.on("portalCreation", (data) => {
            // if (portalArr.length > 0) {
            //     portalNum = portalNum + 1
            //     data.portal.id = "portal" + portalNum;
            // } else {
            //     data.portal.id = "portal" + portalNum;
            // }

            // portalArr.push(data.portal);
            // userArr[data.user].score = userArr[data.user].score - 3
            // io.sockets.in(roomId).emit('portal-spawn', { portal: data.portal, array: portalArr, type: "create" });
        })

        socket.on("portalFeeding", (data) => {
            console.log(userArr[data.user]);
            userArr[data.user].score = userArr[data.user].score - 1;
            portalArr[data.portal].energy = portalArr[data.portal].energy + 15;
        })
    })
})
 
server.listen(PORT);