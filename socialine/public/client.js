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
        client: {
            _id: "lEmTPP5GDuccJV9A",
            name: "Fernando",
            pictureUrl: "https://randomuser.me/api/portraits/men/57.jpg",
            about: "Haciendo un post nuevo.",
            lastConnection: "online",
            latitude: 40.2399098,
            longitude: -3.6927629,
            maxKmDistance: 5000
        },
        clientMessages: [],
        users: [],
        selectedUser: { name: '', pictureUrl: '', about: '', lastConnection: '' },
        messages: [],
        messageInput: '',
        selectedLogSelector: 'loginLog'
    },
    computed: {
        chatBody: function () {
            return;
        },
        location: function () {
            console.log('location');
            navigator.geolocation.getCurrentPosition(success => {
                console.log(success);
                return success;
            }, error => {
                console.log(error);
                return error;
            });
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
                $limit: 200,
                $or: [
                    { sender: this.client._id },
                    { receiver: this.client._id }
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

        console.log(this.client.location);
    },
    updated: function () {
        console.log('updated');
        this.scrollChatBody();
    },
    methods: {
        selectUser: function (user) {
            console.log(user);
            this.selectedUser = user;
            this.toggleClass(this.$el.querySelector('.sidebar'), 'hidden');
            this.toggleClass(this.$el.querySelector('.chat-wrapper'), 'visible');
        },
        toggleSlidingPanel: function (slidingPanelClass) {
            this.toggleClass(this.$el.querySelector(`.${slidingPanelClass}`), 'visible');
        },
        hideChat: function () {
            this.toggleClass(this.$el.querySelector('.sidebar'), 'hidden');
            this.toggleClass(this.$el.querySelector('.chat-wrapper'), 'visible');
        },
        sendMessage: function () {
            if (this.messageInput != '') {
                messagesService.create({
                    sender: this.client._id,
                    receiver: this.selectedUser._id,
                    text: this.messageInput,
                    timestamp: moment()
                })
                this.messageInput = '';
            }
        },
        scrollChatBody: function () {
            console.log('scrollBody');
            this.$el.querySelector('.chat-body').scrollTop = this.$el.querySelector('.chat-body').scrollHeight;
        },
        toggleClass: function (element, className) {
            if (element.classList.contains(className)) {
                element.classList.remove(className);
            } else {
                element.classList.add(className);
            }
        },
        kmBetweenLocations: function (lat1, lat2, lon1, lon2) {
            var p = 0.017453292519943295;    // Math.PI / 180
            var c = Math.cos;
            var a = 0.5 - c((lat2 - lat1) * p) / 2 +
                c(lat1 * p) * c(lat2 * p) *
                (1 - c((lon2 - lon1) * p)) / 2;

                console.log(12742 * Math.asin(Math.sqrt(a)));
            return 12742 * Math.asin(Math.sqrt(a)); // 2 * R; R = 6371 km
        }
    },
    filters: {
        momentTimestamp: function (date) {
            return moment(date).format("hh:mm")
        }
    },

});