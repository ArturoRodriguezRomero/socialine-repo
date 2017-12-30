// Initializes the `accounts` service on path `/accounts`
const createService = require('feathers-nedb');
const createModel = require('../../models/accounts.model');
const hooks = require('./accounts.hooks');

module.exports = function (app) {
  const Model = createModel(app);
  const paginate = app.get('paginate');

  const options = {
    name: 'accounts',
    Model,
    paginate
  };

  // Initialize our service with any options it requires
  app.use('/accounts', createService(options));

  // Get our initialized service so that we can register hooks and filters
  const service = app.service('accounts');

  service.hooks(hooks);
};
