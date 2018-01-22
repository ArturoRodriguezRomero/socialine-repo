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
                this.setSelectableImageUrl();
            });
            usersService.on('created', user => {
                console.log('Realtime', user);
                this.users.push(user);
            });
            usersService.on('patched', patchedUser => {
                // TO BE REPLACED WITH VUE'S STOREX
                this.users.splice(this.users.indexOf(this.users.find(user => { return user._id == patchedUser._id })), 1, patchedUser);
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
                console.log(messages);
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
                // TO BE REPLACED WITH VUE'S STOREX
                console.log('message patched')
                this.clientMessages.splice(this.clientMessages.indexOf(this.clientMessages.find(message => { return message._id == patchedMessage._id })), 1, patchedMessage);
            });
            this.getUnreadMessages();
            this.client.lastConnection = 'online';
            this.saveClientUser();
            window.addEventListener('beforeunload', event => {
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
        },
        selectUser: function (user) {
            console.log(user);
            this.selectedUser = user;
            this.toggleClass(this.$el.querySelector('.sidebar'), 'hidden');
            this.toggleClass(this.$el.querySelector('.chat-wrapper'), 'visible'); receiverSettingsPanel
            this.$el.querySelector('#receiverSettingsPanel').classList.remove('expanded');
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
            this.unreadMessages--;
            this.documentTitleNotification(this.unreadMessages);
        },
        getUnreadMessages: function () {
            messagesService.find({
                query: {
                    receiver: this.client._id,
                    readByReceiver: false
                }
            }).then(unreadMessages => {
                this.unreadMessages = unreadMessages.data.length;
                this.documentTitleNotification(unreadMessages.data.length);
                return unreadMessages.data;
            })
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
            console.log('signup');
            accountsService.create({
                username: this.signupUsername,
                password: this.signupPassword
            }).then(account => {
                console.log(account);
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
                                console.log('user', user);
                                console.log('this.client', this.client);
                                client.authenticate(Object.assign({ strategy: 'local' }, this.signUpCredentials)).then(resolve => {
                                    this.client = user;
                                    console.log(this.client);
                                    this.loadApp();
                                });
                            });
                        });
                    });
                });
            });
        },
        login: function () {
            console.log('login');
            // TO BE CHANGED TO SERVER-SIDE-BASED AUTHENTICATION
            client.authenticate(Object.assign({ strategy: 'local' }, this.logInCredentials)).then(token => {
                client.authenticate().then(() => {
                    accountsService.find({
                        query: {
                            username: this.logInCredentials.username,
                            $limit: 1
                        }
                    }).then(result => {
                        usersService.find({
                            query: {
                                accountId: result.data[0]._id
                            }
                        }).then(result => {
                            this.client = result.data[0];
                            this.loadApp();
                            localStorage.setItem('client', JSON.stringify(this.client));
                        });
                    });
                });
            });
        },
        saveClientUser: function () {
            usersService.patch(this.client._id, {
                accountId: this.client.accountId,
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
                this.client = client;
                localStorage.setItem('client', JSON.stringify(this.client));
            });
        },
        signOut: function () {
            this.client.lastConnection = moment().utc();
            this.saveClientUser();
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
            console.log('unblock all')
            this.client.blockedUsers = [];
            this.saveClientUser();
        },
        isMomentAfter: function (date1, date2, type) {
            console.log('isafter', moment(date1).isAfter(date2, type))
            return moment(date1).isAfter(date2, type);
        },
        isMessageAfter: function (index, clientId, selectedUserId) {
            let nextMessage = this.clientMessages.slice(index).find(item => {
                return item.receiver == clientId && item.sender == selectedUserId || item.receiver == selectedUserId && item.sender == clientId;
            });
            console.log(nextMessage);
            return nextMessage;
        },
        testImage: function (url, timeoutT) {
            return new Promise(function (resolve, reject) {
                var timeout = timeoutT || 5000;
                var timer, img = new Image();
                img.onerror = img.onabort = function () {
                    clearTimeout(timer);
                    reject("error");
                };
                img.onload = function () {
                    clearTimeout(timer);
                    resolve("success");
                };
                timer = setTimeout(function () {
                    // reset .src to invalid URL so it stops previous
                    // loading, but doesn't trigger new load
                    img.src = "//!!!!/test.jpg";
                    reject("timeout");
                }, timeout);
                img.src = url;
            });
        },
        isUrl: function (string) { // THIS IS TOO PERFORMANCE HEAVY
            var pattern = new RegExp('^(https?:\\/\\/)?' + // protocol
                '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name and extension
                '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
                '(\\:\\d+)?' + // port
                '(\\/[-a-z\\d%@_.~+&:]*)*' + // path
                '(\\?[;&a-z\\d%@_.,~+&:=-]*)?' + // query string
                '(\\#[-a-z\\d_]*)?$', 'i'); // fragment locator
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