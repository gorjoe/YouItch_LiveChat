const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const { LiveChat } = require("youtube-chat")
const tmi = require('tmi.js');
const liveChat = new LiveChat({liveId: "your YouTube live chat ID here"})
const https = require('https');

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
  console.log('a user connected');

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

const port = process.env.PORT || 3000;

server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

// ===================================================
// Emit at receive chat.
// chat: ChatItem
liveChat.on("chat", (chatItem) => {
    io.emit('output', {
        platform: "youtube",
        icon: chatItem.author.thumbnail.url,
        name: chatItem.author.name,
        message: chatItem.message[0]["text"]
    });
})

const client = new tmi.Client({
    channels: [ 'gorjoe' ]
});

client.connect();

client.on('message', (channel, tags, message, self) => {
    //console.log(`Twitch. ${tags['display-name']}: ${message}`);

    const options = {
        hostname: 'api.twitch.tv',
        path: '/helix/users?login=' + tags['username'],
        headers: {
            'Authorization': 'Your Authorization key here',  // It should look this 'Bearer xxxxxxxxxxxxxxxxxxxxxx'
            'Client-Id': 'Your Client-Id here'
        }
    }

    https.get(options, (resp) => {
      let data = '';

      // A chunk of data has been recieved.
      resp.on('data', (chunk) => {
        data += chunk;
      });

      // The whole response has been received. Print out the result.
      resp.on('end', () => {
        let icon = "https://cdn.pixabay.com/photo/2021/12/10/16/38/twitch-6860918_1280.png"

        if(JSON.parse(data).data[0].profile_image_url !== ""){
            icon = JSON.parse(data).data[0].profile_image_url;

        } else if(JSON.parse(data).data[0].offline_image_url !== ""){
            icon = JSON.parse(data).data[0].offline_image_url;

        } else {
            icon = "https://cdn.pixabay.com/photo/2021/12/10/16/38/twitch-6860918_1280.png";
        }

            //console.log(icon);

            io.emit('output', {
                platform: "twitch",
                icon: icon,
                name: tags['display-name'],
                message: message
            });

      });

    })
});

liveChat.start()

// ===================================================