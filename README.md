# Socket.IO Chat

 This is a real-time messaging application built using the Socket.IO library.

## Features

- Real-time messaging using Socket.IO.
- Message timestamp and deletion after a specific time.
- Automatic message deletion after a set time period.
- Anti Spam (Send message every 2 seconds + cooldown)

## Installation

To get started, follow these steps:

1. Clone the repository: `git clone (https://github.com/Julian045/socket.io-chat.git)`
2. Navigate to the project directory: `cd socket.io-chat`
3. Install dependencies: `npm install`
4. Start the development server: `npm start`

## Usage

Here's how you can use the Socket.IO chat:

```javascript
const socket = io.connect('http://localhost:80');

// Join a chat room
socket.emit('newUser', 'Username');

// Send a chat message
socket.emit('chat message', 'Username', 'Hello, world!');
```

Feel free to modify the content and structure to fit your preferences and project specifics.
