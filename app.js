require('dotenv').config();
const express = require('express');
const socket = require('socket.io');
const http = require('http');
const path = require('path');
const { Chess } = require('chess.js');

const app = express();
const server = http.createServer(app);
const io = socket(server);

const chess = new Chess();
let players = {};
let currentPlayer = 'w';

const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.render('index', { title: "Chess Game" });
});


io.on("connection", (uniquesocket) => {
    console.log("Client connected:", uniquesocket.id);

    if (!players.white) {
        players.white = uniquesocket.id;
        uniquesocket.emit('playerRole', 'w');
    } else if (!players.black) {
        players.black = uniquesocket.id;
        uniquesocket.emit('playerRole', 'b');
    } else {
        uniquesocket.emit("spectatorRole");
    }

    uniquesocket.on('disconnect', () => {
        if (uniquesocket.id === players.white) delete players.white;
        else if (uniquesocket.id === players.black) delete players.black;
    });

    uniquesocket.on("move", (move) => {
        try {
            if ((chess.turn() === 'w' && uniquesocket.id !== players.white) ||
                (chess.turn() === 'b' && uniquesocket.id !== players.black)) {
                return;
            }

            const result = chess.move(move);
            if (result) {
                currentPlayer = chess.turn();
                io.emit('move', move);
                io.emit('boardState', chess.fen());
            } else {
                console.log("Invalid move: ", move);
                uniquesocket.emit("invalidMove", move);
            }
        } catch (err) {
            console.log(err);
            uniquesocket.emit("invalidMove", move);
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
