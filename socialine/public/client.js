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
        client: {name: 'Arturo', about: 'Programando'},
        users: [{name: 'Gonzalo', imageUrl: 'www.google.com'}, {name: 'Fernando', imageUrl: 'www.google.com'}],
        messages: [],
    }
});