const { authenticate } = require('@feathersjs/authentication').hooks;

module.exports = {
  before: {
    all: [authenticate('jwt')],
    find: [],
    get: [],
    create: [context => {
      context.data = {
        accountId: context.data.accountId,
        name: context.data.name,
        pictureUrl: "https://pbs.twimg.com/media/CLI0ZQmUkAA9int.png",
        about: "Hey there, I'm using Socialine",
        lastConnection: "online",
        latitude: context.data.latitude,
        longitude: context.data.longitude,
        maxKmDistance: 25,
        backgroundImageUrl: 'https://wallpaperscraft.com/image/giau_pass_italy_alps_118374_3840x2400.jpg',
        blockedUsers: [],
        favoriteUsers: [],
        localMessageColor: '#ffcac9'
      }
      return context;
    }],
    update: [],
    patch: [],
    remove: []
  },

  after: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  },

  error: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  }
};
