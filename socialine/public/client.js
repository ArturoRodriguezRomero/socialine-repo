// Establish a Socket.io connection
const socket = io();
// Initialize our Feathers client application through Socket.io
// with hooks and authentication.
const client = feathers();

client.configure(feathers.socketio(socket));
// Use localStorage to store our login token
client.configure(feathers.authentication({
  storage: window.localStorage
}));

// Store : messages.on() array

new Vue({
    el: '#app',
    data: {
        client: {name: 'Arturo', pictureUrl: 'https://randomuser.me/api/portraits/men/80.jpg', about: 'Programando'},
        users: [
            {name: 'Gonzalo', pictureUrl: 'http://i.dailymail.co.uk/i/pix/2017/04/20/13/3F6B966D00000578-4428630-image-m-80_1492690622006.jpg', about: 'Enseñando a programar'},
            {name: 'Gonzalo', pictureUrl: 'http://i.dailymail.co.uk/i/pix/2017/04/20/13/3F6B966D00000578-4428630-image-m-80_1492690622006.jpg', about: 'Enseñando a programar'},
            {name: 'Gonzalo', pictureUrl: 'http://i.dailymail.co.uk/i/pix/2017/04/20/13/3F6B966D00000578-4428630-image-m-80_1492690622006.jpg', about: 'Enseñando a programar'},
            {name: 'Gonzalo', pictureUrl: 'http://i.dailymail.co.uk/i/pix/2017/04/20/13/3F6B966D00000578-4428630-image-m-80_1492690622006.jpg', about: 'Enseñando a programar'},
            {name: 'Gonzalo', pictureUrl: 'http://i.dailymail.co.uk/i/pix/2017/04/20/13/3F6B966D00000578-4428630-image-m-80_1492690622006.jpg', about: 'Enseñando a programar'},
            {name: 'Gonzalo', pictureUrl: 'http://i.dailymail.co.uk/i/pix/2017/04/20/13/3F6B966D00000578-4428630-image-m-80_1492690622006.jpg', about: 'Enseñando a programar'},
            {name: 'Gonzalo', pictureUrl: 'http://i.dailymail.co.uk/i/pix/2017/04/20/13/3F6B966D00000578-4428630-image-m-80_1492690622006.jpg', about: 'Enseñando a programar'},
            {name: 'Gonzalo', pictureUrl: 'http://i.dailymail.co.uk/i/pix/2017/04/20/13/3F6B966D00000578-4428630-image-m-80_1492690622006.jpg', about: 'Enseñando a programar'},
            {name: 'Gonzalo', pictureUrl: 'http://i.dailymail.co.uk/i/pix/2017/04/20/13/3F6B966D00000578-4428630-image-m-80_1492690622006.jpg', about: 'Enseñando a programar'},
            {name: 'Gonzalo', pictureUrl: 'http://i.dailymail.co.uk/i/pix/2017/04/20/13/3F6B966D00000578-4428630-image-m-80_1492690622006.jpg', about: 'Enseñando a programar'},
            {name: 'Gonzalo', pictureUrl: 'http://i.dailymail.co.uk/i/pix/2017/04/20/13/3F6B966D00000578-4428630-image-m-80_1492690622006.jpg', about: 'Enseñando a programar'},
            {name: 'Gonzalo', pictureUrl: 'http://i.dailymail.co.uk/i/pix/2017/04/20/13/3F6B966D00000578-4428630-image-m-80_1492690622006.jpg', about: 'Enseñando a programar'},
            {name: 'Gonzalo', pictureUrl: 'http://i.dailymail.co.uk/i/pix/2017/04/20/13/3F6B966D00000578-4428630-image-m-80_1492690622006.jpg', about: 'Enseñando a programar'},
            {name: 'Gonzalo', pictureUrl: 'http://i.dailymail.co.uk/i/pix/2017/04/20/13/3F6B966D00000578-4428630-image-m-80_1492690622006.jpg', about: 'Enseñando a programar'},
            {name: 'Gonzalo', pictureUrl: 'http://i.dailymail.co.uk/i/pix/2017/04/20/13/3F6B966D00000578-4428630-image-m-80_1492690622006.jpg', about: 'Enseñando a programar'},
            {name: 'Gonzalo', pictureUrl: 'http://i.dailymail.co.uk/i/pix/2017/04/20/13/3F6B966D00000578-4428630-image-m-80_1492690622006.jpg', about: 'Enseñando a programar'},
            {name: 'Gonzalo', pictureUrl: 'http://i.dailymail.co.uk/i/pix/2017/04/20/13/3F6B966D00000578-4428630-image-m-80_1492690622006.jpg', about: 'Enseñando a programar'},
        ],
        messages: [],
    }
});