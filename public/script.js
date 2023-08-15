const socket = io();

const sendMessage = document.getElementById('sendMessage');
const input = document.getElementById('input');
const messages = document.getElementById('messages');

let nickname = localStorage.getItem('nickname') || '';

function emitMessage() {
    if (input.value) {
        socket.emit('chat message', nickname, input.value);
        input.value = '';
    }
}

function getRandomColor() {
    let letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) color += letters[Math.floor(Math.random() * 16)];
    return color;
}

document.addEventListener('keydown', e => {
    switch(e.key) {
        case 'Enter':
            emitMessage();
            break;
    }
});

function createMessage(sender, message, isSystemMessage = false) {
    const now = new Date();

    const hour = now.getHours();
    const minutes = now.getMinutes();
    const formattedTime = `${hour}:${minutes < 10 ? '0' : ''}${minutes}`;
    
    const div = document.createElement('div');
    div.classList.add('message');
  
    const span = document.createElement('span');
    span.classList.add('nick');
    span.textContent = isSystemMessage ? "*" : sender;
    if (isSystemMessage) span.setAttribute('title', 'System');
    else span.setAttribute('title', formattedTime);
  
    const p = document.createElement('p');
    p.classList.add('text');
  
    const p2 = document.createElement('p');
    p2.textContent = message;
  
    messages.appendChild(div);
    div.appendChild(span);
    div.appendChild(p);
    p.appendChild(p2);
  
    span.style.color = isSystemMessage ? "#99C21D" : localStorage.getItem('nicknameColor');
    if (isSystemMessage) p2.style.color = "#99C21D";

    window.scrollTo(0, document.body.scrollHeight);
}

socket.on('initial messages', messages => {
    for (const message of messages) {
      createMessage(message.sender, message.message, false, message.timestamp);
    }
});

socket.on('chat message', (sender, message) => {
    createMessage(sender, message);
});

socket.on('system message', message => {
    createMessage(null, message, true);
});

socket.on('connect', () => {
    let newNickname = prompt('Your nickname?', nickname);
    if(newNickname !== '' || newNickname !== null) {
        nickname = newNickname;
    } else {
        window.location.href = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
    }
    if(nickname) {
        localStorage.setItem('nickname', nickname);
        localStorage.setItem('nicknameColor', getRandomColor());
        socket.emit('newUser', nickname);
    }
});

socket.on('disconnect', () => {});