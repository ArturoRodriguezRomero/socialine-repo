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

var app = new Vue({
    el: '#app',
    data: {
        client: { name: 'Arturo', pictureUrl: 'https://randomuser.me/api/portraits/men/80.jpg', about: 'Programando' },
        users: [],
        selectedUser: {name: '', pictureUrl: '', about: '', lastConnection: ''},
        messages: [],
    },
    methods: {
        selectUser: function (user){
            console.log(user);
            this.selectedUser = user;
        },
        toggleSlidingPanel: function (slidingPanelClass) {
            this.toggleClass(document.querySelector(`.${slidingPanelClass}`), 'visible');
        },
        toggleClass: function(element, className){
            if(element.classList.contains(className)){
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
        usersService.on('created', (user) => {
            console.log('Realtime', user);
            this.users.push(user);
        });
    }
});