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

const accountsService = client.service('accounts');
const usersService = client.service('users');
const messagesService = client.service('messages');
const authenticationService = client.service('authentication');

var app = new Vue({
    el: '#app',
    data: {
        client: null,
        clientMessages: [],
        users: [],
        selectedUser: { name: '', pictureUrl: '', about: '', lastConnection: '' },
        messageInput: '',
        selectedLogSelector: 'loginLog',
        signupUsername: '',
        signupPassword: '',
        signupConfirmPassword: '',
        signupName: '',
        loginUsername: '',
        loginPassword: ''
    },
    created: function () {
        if (localStorage.getItem('feathers-jwt') && localStorage.getItem('client')) {
            console.log(localStorage.getItem('feathers-jwt'));
            client.authenticate({ strategy: 'jwt', accessToken: localStorage.getItem('feathers-jwt') }).then(() => {
                this.client = JSON.parse(localStorage.getItem('client'));
                this.loadApp();
            });
        }
    },
    updated: function () {
        //console.log('updated');
        // TO BE ADDED (IF SO IT ONLY DOES IT PROPERLY)
        this.scrollChatBody();
    },
    computed: {
        signUpCredentials: function () {
            return { username: this.signupUsername, password: this.signupPassword };
        },
        logInCredentials: function () {
            return { username: this.loginUsername, password: this.loginPassword };
        }
    },
    methods: {
        loadApp: function () {
            usersService.find().then(users => {
                console.log('Load', users.data);
                this.users = users.data;
            });
            usersService.on('created', user => {
                console.log('Realtime', user);
                this.users.push(user);
            });
            usersService.on('patched', patchedUser => {
                // TO BE REPLACED WITH VUE'S STOREX
                this.users.splice(this.users.indexOf(this.users.find(user => { return user._id == patchedUser._id })), 1, patchedUser);
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
                console.log('Realtime message', message);
                this.clientMessages.push(message);
                console.log(message.sender, this.selectedUser._id)
                if(message.sender == this.selectedUser._id){
                    this.setMessageRead(message._id);
                }
            });
            messagesService.on('patched', patchedMessage => {
                // TO BE REPLACED WITH VUE'S STOREX
                console.log('message patched')
                this.clientMessages.splice(this.clientMessages.indexOf(this.clientMessages.find(message => { return message._id == patchedMessage._id })), 1, patchedMessage);
            });
        },
        selectUser: function (user) {
            console.log(user);
            this.selectedUser = user;
            this.toggleClass(this.$el.querySelector('.sidebar'), 'hidden');
            this.toggleClass(this.$el.querySelector('.chat-wrapper'), 'visible');
            messagesService.find({
                query: {
                    sender: this.selectedUser._id,
                    receiver: this.client._id,
                    readByReceiver: false
                }
            }).then(unreadMessages => {
                unreadMessages.data.forEach(message => {
                    console.log('patched');
                    this.setMessageRead(message._id);
                });
            })
        },
        setMessageRead: function (id) {
            messagesService.patch(id, {
                readByReceiver: true
            });
        },
        toggleSlidingPanel: function (slidingPanelClass) {
            this.toggleClass(this.$el.querySelector(`.${slidingPanelClass}`), 'visible');
        },
        hideChat: function () {
            this.toggleClass(this.$el.querySelector('.sidebar'), 'hidden');
            this.toggleClass(this.$el.querySelector('.chat-wrapper'), 'visible');
            this.selectedUser = { _id: '' };
        },
        sendMessage: function () {
            if (this.messageInput != '') {
                messagesService.create({
                    sender: this.client._id,
                    receiver: this.selectedUser._id,
                    text: this.messageInput,
                    timestamp: moment(),
                    readByReceiver: false
                });
                this.messageInput = '';
            }
        },
        signUp: function () {
            if (this.signupUsername == '' || this.signupPassword == '' || this.signupConfirmPassword == '' || this.signupName == '') {
                return;
            }
            console.log('signup');
            accountsService.create({
                username: this.signupUsername,
                password: this.signupPassword
            }).then(account => {
                console.log(account);
                client.authenticate(Object.assign({ strategy: 'local' }, this.signUpCredentials)).then(resolve => {
                    navigator.geolocation.getCurrentPosition(success => {
                        console.log(success);
                        usersService.create({
                            accountId: account._id,
                            name: this.signupName,
                            pictureUrl: "https://pbs.twimg.com/media/CLI0ZQmUkAA9int.png",
                            about: "Hey there, I'm using Socialine",
                            lastConnection: "online",
                            latitude: success.coords.latitude,
                            longitude: success.coords.longitude,
                            maxKmDistance: 15
                        }).then(user => {
                            console.log('user', user);
                            //this.client = user;
                            console.log('this.client', this.client);
                            client.authenticate(Object.assign({ strategy: 'local' }, this.signUpCredentials)).then(resolve => {
                                this.client = user;
                                console.log(this.client);
                                this.loadApp();
                            });
                        });
                    }, error => {
                        console.log(error);
                    });
                });
            });
        },
        login: function () {
            console.log('login');

            client.authenticate(Object.assign({ strategy: 'local' }, this.logInCredentials)).then(token => {
                client.authenticate().then(() => {
                    accountsService.find({
                        query: {
                            username: this.logInCredentials.username,
                            $limit: 1
                        }
                    }).then(result => {
                        console.log(result.data[0]._id);
                        usersService.find({
                            query: {
                                accountId: result.data[0]._id
                            }
                        }).then(result => {
                            console.log(result.data[0]);
                            this.client = result.data[0];
                            this.loadApp();
                            localStorage.setItem('client', JSON.stringify(this.client));
                        });
                    });
                });
            });

            // TO BE CHANGED TO SERVER-SIDE-BASED AUTHENTICATION

        },
        saveClientUser: function () {
            usersService.patch(this.client._id, {
                pictureUrl: this.client.pictureUrl,
                name: this.client.name,
                about: this.client.about,
                maxKmDistance: this.client.maxKmDistance
            }).then(client => {
                this.client = client;
            })
        },
        signOut: function () {
            localStorage.removeItem('client');
            localStorage.removeItem('feathers-jwt');
            this.client = null;
            location.reload();
        },
        scrollChatBody: function () {
            if (this.client != null) {
                this.$el.querySelector('.chat-body').scrollTop = this.$el.querySelector('.chat-body').scrollHeight;
            }
        },
        focusInput: function (id) {
            console.log('focusinput');
            this.$el.querySelector(`#${id}`).focus();
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

            //console.log(12742 * Math.asin(Math.sqrt(a)));
            return 12742 * Math.asin(Math.sqrt(a)); // 2 * R; R = 6371 km
        }
    },
    filters: {
        momentTimestamp: function (date) {
            return moment(date).format("hh:mm")
        }
    },

});