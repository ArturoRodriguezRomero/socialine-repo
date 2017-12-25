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

const usersService = client.service('users');
const messagesService = client.service('messages');

var app = new Vue({
    el: '#app',
    data: {
        client: {about:"Haciendo un post nuevo.", lastConnection:"online", name:"Fernando", pictureUrl:"https://randomuser.me/api/portraits/men/57.jpg", _id:"Q4F6fck89d8lUv9c"},
        clientMessages: [],
        users: [],
        selectedUser: { name: '', pictureUrl: '', about: '', lastConnection: '' },
        messages: [],
        messageInput: ''
    },
    methods: {
        selectUser: function (user) {
            console.log(user);
            this.selectedUser = user;
            this.toggleClass(document.querySelector('.sidebar'), 'hidden');
            this.toggleClass(document.querySelector('.chat-wrapper'), 'visible');
        },
        toggleSlidingPanel: function (slidingPanelClass) {
            this.toggleClass(document.querySelector(`.${slidingPanelClass}`), 'visible');
        },
        hideChat: function () {
            this.toggleClass(document.querySelector('.sidebar'), 'hidden');
            this.toggleClass(document.querySelector('.chat-wrapper'), 'visible');
        },
        sendMessage: function () {
            messagesService.create({
                sender: this.client._id,
                receiver: this.selectedUser._id,
                text: this.messageInput,
                timestamp: new Date()
            })
            this.messageInput = '';
        },
        toggleClass: function (element, className) {
            if (element.classList.contains(className)) {
                element.classList.remove(className);
            } else {
                element.classList.add(className);
            }
        }
    },
    created: function () {
        usersService.find().then(users => {
            console.log('Load', users.data);
            this.users = users.data;
        });
        usersService.on('created', user => {
            console.log('Realtime', user);
            this.users.push(user);
        });
        messagesService.find({
            query: {
                $or: [
                    {sender: this.client._id},
                    {receiver: this.client._id}
                ],
                $sort: {
                    timestamp: 1
                }
            }
        }).then(messages => {
            console.log(messages);
            this.clientMessages = messages.data;
        });
        messagesService.on('created', message => {
            console.log(message);
            this.clientMessages.push(message);
        });
    }
});