const socket = io();
const client = feathers();

client.configure(feathers.socketio(socket));
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
        selectedUserMessages: [],
        users: [],
        selectedUser: { name: '', pictureUrl: '', about: '', lastConnection: '' },
        messageInput: '',
        selectedLogSelector: 'loginLog',
        signupUsername: '',
        signupPassword: '',
        signupConfirmPassword: '',
        signupName: '',
        loginUsername: '',
        loginPassword: '',
        unreadMessages: 0
    },
    created: function () {
        if (localStorage.getItem('feathers-jwt') && localStorage.getItem('client')) {
            client.authenticate({ strategy: 'jwt', accessToken: localStorage.getItem('feathers-jwt') }).then(() => {
                this.client = JSON.parse(localStorage.getItem('client'));
                this.loadApp();
            });
        }
    },
    updated: function () {
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
                this.users = users.data;
                this.setSelectableImageUrl();
            });
            usersService.on('created', user => {
                this.users.push(user);
            });
            usersService.on('patched', patchedUser => {
                this.users.splice(this.users.indexOf(this.users.find(user => { return user._id == patchedUser._id })), 1, patchedUser);
                console.log('user patched');
                if (patchedUser._id == this.selectedUser._id) {
                    this.selectedUser = patchedUser;
                }
            });
            messagesService.find({
                query: {
                    $limit: 200,
                    $or: [
                        { sender: this.client._id },
                        { receiver: this.client._id }
                    ],
                    $sort: {
                        timestamp: -1
                    }
                }
            }).then(messages => {
                this.clientMessages = messages.data;
            });
            messagesService.on('created', message => {
                if (message.sender == this.client._id || message.receiver == this.client._id) {
                    this.clientMessages.unshift(message);
                    if (message.receiver == this.client._id) {
                        this.unreadMessages++;
                    }
                    this.documentTitleNotification(this.unreadMessages);
                    if (document.hasFocus()) {
                        if (message.sender == this.selectedUser._id && message.receiver == this.client._id) {
                            this.setMessageRead(message._id);
                        }
                    } else if (message.receiver == this.client._id) {
                        usersService.get(message.sender).then(user => {
                            this.desktopNotification({ user: user.name, body: message.text, icon: user.pictureUrl });
                        });
                    }
                }
            });
            messagesService.on('patched', patchedMessage => {
                this.clientMessages.splice(this.clientMessages.indexOf(this.clientMessages.find(message => { return message._id == patchedMessage._id })), 1, patchedMessage);
            });
            window.addEventListener('beforeunload', event => {
                alert('beforeunload');
                this.client.lastConnection = moment().utc();
                this.saveClientUser();
            });
            window.addEventListener('focus', event => {
                if (this.selectedUser != null) {
                    this.clientMessages.filter(message => { return message.receiver == this.client._id && message.sender == this.selectedUser._id && !message.readByReceiver }).forEach(message => {
                        this.setMessageRead(message._id);
                    });
                }
            });
            this.getGeoLocation().then(result => {
                result.json().then(json => {
                    this.client.latitude = json.latitude;
                    this.client.longitude = json.longitude;
                });
            });
            this.getUnreadMessages();
            this.client.lastConnection = 'online';
            this.saveClientUser();
        },
        selectUser: function (user) {
            this.selectedUser = user;
            this.toggleClass(this.$el.querySelector('.sidebar'), 'hidden');
            this.toggleClass(this.$el.querySelector('.chat-wrapper'), 'visible');
            this.$el.querySelector('#receiverSettingsPanel').classList.remove('expanded');
            this.clientMessages.filter(message => { return message.receiver == this.client._id && message.sender == this.selectedUser._id && !message.readByReceiver }).forEach(message => {
                this.setMessageRead(message._id);
            });
        },
        setMessageRead: function (id) {
            messagesService.patch(id, {
                readByReceiver: true
            });
            this.unreadMessages--;
            this.documentTitleNotification(this.unreadMessages);
        },
        getUnreadMessages: function () {
            let unreadMessages = this.clientMessages.filter(message => { return message.receiver == this.client._id && message.sender == this.selectedUser._id && !message.readByReceiver });
            this.unreadMessages = unreadMessages.length;
            this.documentTitleNotification(unreadMessages.length);
            return unreadMessages;
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
                    timestamp: moment().utc(),
                    readByReceiver: false
                });
                this.messageInput = '';
            }
        },
        signUp: function () {
            if (this.signupUsername == '' || this.signupPassword == '' || this.signupConfirmPassword == '' || this.signupName == '') {
                return;
            }
            accountsService.create({
                username: this.signupUsername,
                password: this.signupPassword
            }).then(account => {
                client.authenticate(Object.assign({ strategy: 'local' }, this.signUpCredentials)).then(resolve => {
                    this.getGeoLocation().then(result => {
                        result.json().then(json => {
                            let latitude = json.latitude;
                            let longitude = json.longitude;
                            usersService.create({
                                accountId: account._id,
                                name: this.signupName,
                                latitude: latitude,
                                longitude: longitude,
                            }).then(user => {
                                client.authenticate(Object.assign({ strategy: 'local' }, this.signUpCredentials)).then(resolve => {
                                    this.client = user;
                                    this.loadApp();
                                });
                            });
                        });
                    });
                });
            });
        },
        login: function () {
            client.authenticate(Object.assign({ strategy: 'local' }, this.logInCredentials)).then(result => {
                this.client = result.user;
                this.loadApp();
                localStorage.setItem('client', JSON.stringify(this.client));
            });
        },
        saveClientUser: function () {
            localStorage.setItem('client', JSON.stringify(this.client));
            usersService.patch(this.client._id, {
                pictureUrl: this.client.pictureUrl,
                name: this.client.name,
                about: this.client.about,
                maxKmDistance: this.client.maxKmDistance,
                backgroundImageUrl: this.client.backgroundImageUrl,
                localMessageColor: this.client.localMessageColor,
                favoriteUsers: this.client.favoriteUsers,
                blockedUsers: this.client.blockedUsers,
                lastConnection: this.client.lastConnection
            }).then(client => {
                //this.client = client;
            });
        },
        signOut: function () {
            this.client.lastConnection = moment().utc();
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

            return 12742 * Math.asin(Math.sqrt(a)); // 2 * R; R = 6371 km
        },
        getRandomImage: function (options) {
            return fetch(`https://picsum.photos/${options.grayscale ? 'g/' : ''}${options.width ? options.width : '2000'}/${options.height ? options.height : '2000'}${options.blur ? '/?blur' : ''}/?random`);
        },
        setSelectableImageUrl: function () {
            let elements = this.$el.querySelectorAll('.selectable.image');
            elements.forEach(element => {
                this.getRandomImage({ grayscale: false, blur: false }).then(response => {
                    element.style.backgroundImage = `url(${response.url})`;
                    element.dataset.url = response.url;
                });
            });
        },
        selectBackgroundImage: function (event) {
            let elements = this.$el.querySelectorAll('.selectable.image');
            elements.forEach(element => {
                element.classList.remove('selected');
            });
            event.target.classList.add('selected');
            this.client.backgroundImageUrl = event.target.dataset.url;
        },
        selectMessageColor: function (event) {
            let elements = this.$el.querySelectorAll('.selectable.color');
            elements.forEach(element => {
                element.classList.remove('selected');
            });
            event.target.classList.add('selected');
            this.client.localMessageColor = event.target.dataset.color;
            this.saveClientUser();
        },
        expandPanel: function (id) {
            let element = this.$el.querySelector(`#${id}`);
            this.toggleClass(element, 'expanded');
        },
        toggleFavoriteUser: function (id) {
            if (this.client.favoriteUsers.includes(id)) {
                this.client.favoriteUsers.splice(this.client.favoriteUsers.indexOf(id), 1);
            } else {
                this.client.favoriteUsers.push(id);
            }
            this.saveClientUser();
        },
        toggleBlockUser: function (id) {
            if (this.client.blockedUsers.includes(id)) {
                this.client.blockedUsers.splice(this.client.blockedUsers.indexOf(id), 1);
            } else {
                this.client.blockedUsers.push(id);
            }
            this.saveClientUser();
            this.selectedUser = { name: '', pictureUrl: '', about: '', lastConnection: '' }
        },
        unblockAllUsers: function () {
            this.client.blockedUsers = [];
            this.saveClientUser();
        },
        isUrl: function (string) {
            let expression = /[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi;
            let pattern = new RegExp(expression);
            return pattern.test(string);
        },
        isImageUrl: function (string) {
            return (/\.(gif|jpg|jpeg|tiff|png)$/i).test(string)
        },
        documentTitleNotification: function (number) {
            if (number <= 0) {
                document.title = `Socialine`;
            } else {
                document.title = `Socialine (${number})`;
            }
        },
        desktopNotification: function (options) {
            if (Notification.permission !== 'denied') {
                Notification.requestPermission();
            }
            if (Notification.permission === 'granted') {
                var notification = new Notification(options.user, { body: options.body, icon: options.icon });
            }
        },
        getGeoLocation: function () {
            return fetch('http://freegeoip.net/json/');
        }
    },
    filters: {
        momentTimestamp: function (date) {
            return moment(date).local().format("LT");
        },
        momentDateSeparator: function (date) {
            return moment(date).local().format("dddd Do MMMM");
        },
        momentLastConnection: function (date) {
            return moment(date).local().format("LLL");
        }
    },

});