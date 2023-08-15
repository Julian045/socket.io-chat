process.setMaxListeners(0);

const express = require('express');
const { readFileSync, writeFileSync } = require('fs');
const http = require('http');
const socketIo = require('socket.io');

const port = 80;

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let users = [];

const connectedIP = new Map();
const rateLimitMap = new Map();
const userMessages = {};

app.use(express.static(__dirname + '/public'));

io.on('connection', socket => {
    const ip = socket.handshake.address;
    socket.on('newUser', username => {
        if(!connectedIP.has(ip)) {
            connectedIP.set(ip, socket);
        } else {
            io.emit('system message', 'You are already connected. DO NOT RETRY.');
            socket.disconnect();
        }
    
        const user = users.find(storedUsername => storedUsername === username);
    
        if (username === "" || username === null || username === void(0)) {
            socket.disconnect();
        } else {
            socket.room = username;
            socket.join(socket.room);
            users.push(socket.room);

            if(user) {
                io.emit('system message', username + ' is already taken. Join again with a different username.');
                socket.disconnect();
            } else {
                const messages = JSON.parse(readFileSync('messages.json', 'utf-8'));

                io.to(socket.room).emit('initial messages', messages);
                io.to(socket.room).emit('system message', `Your message will be deleted 24hours after you send it.`);
                io.to(socket.room).emit('Users online: ' + users.join(', '));
                io.emit('system message', username + ' joined');
            }
        }
    });

    socket.on('disconnect', () => {
        for(const user of users) {
            if(user === socket.room) {
                io.emit('system message', socket.room + ' left');
                const indexToRemove = users.indexOf(user);

                if (indexToRemove !== -1) {
                    users.splice(indexToRemove, 1);
                    connectedIP.delete(ip);
                }
            }
        }
    });

    socket.on('chat message', (sender, message) => {
        for(const user of users) {
            if(user === socket.room) {
                if(sender !== socket.room) return;
                if (rateLimitMap.has(sender)) {
                    const lastMessageTime = rateLimitMap.get(sender);
                    const currentTime = Date.now();
                    const timeDifference = currentTime - lastMessageTime;

                    const messageRateLimit = 10
                    const timeLimit = 60000;   // 1 minute
                    const cooldownTime = 2000; // 2 seconds        
                    if (timeDifference < timeLimit && userMessages[sender] >= messageRateLimit) {
                        io.to(socket.room).emit('system message', 'you have exceeded message limits. Slow down. (1 minute cooldown)');
                        return;
                    } else if (timeDifference >= timeLimit) {
                        rateLimitMap.set(sender, currentTime);
                        userMessages[sender] = 0;
                    } else if (timeDifference < cooldownTime) {
                        io.to(socket.room).emit('system message', `Wait 2 seconds before sending another message.`);
                        return;
                    }
                } else {
                    rateLimitMap.set(sender, Date.now());
                    userMessages[sender] = 0;
                }
        
                userMessages[sender]++;

                const now = new Date();
                const hour = now.getHours();
                const minutes = now.getMinutes();
                const formattedTime = `${hour}:${minutes < 10 ? '0' : ''}${minutes}`;
                const newMessage = {
                    sender,
                    message,
                    timestamp: formattedTime,
                    ip: ip
                };

                const messages = JSON.parse(readFileSync('messages.json', 'utf-8'));

                messages.push(newMessage);
                writeFileSync('messages.json', JSON.stringify(messages, null, 2));

                io.emit('chat message', sender, message);

                setTimeout(() => {
                    removeMessage(newMessage);
                }, 3600000); //delete msg after 1 hour
            }
        }
    });
});

function removeMessage(messageToRemove) {
    try {
        const messages = JSON.parse(fs.readFileSync('messages.json', 'utf-8'));
      
        const updatedMessages = messages.filter(message => {
            return (message.sender !== messageToRemove.sender || message.message !== messageToRemove.message || message.timestamp !== messageToRemove.timestamp);
        });
 
        writeFileSync('messages.json', JSON.stringify(updatedMessages, null, 2));
    } catch (e) {
        console.error('Error removing specific message:', e);
    }
}  

server.listen(port, () => {
  console.log('Server is running on port ' + port);
});