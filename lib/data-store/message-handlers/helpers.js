/**
 *
 */

var models = require('../../models');


var noopMessage = function noopMessage(dataStore, message) {
  return message;
};


/**
 * {@link https://api.slack.com/events/team_join|team_join}
 * {@link https://api.slack.com/events/user_change|user_change}
 */
var handleNewOrUpdatedUser = function handleNewOrUpdatedUser(dataStore, message) {
  return dataStore.getUserById(message.user.id)
    .then(function handleNewOrUpdatedUserPromiseInner(obj) {
      var user = obj;
      if (user) {
        user.update(message.user);
      } else {
        user = new models.User(message.user);
      }
      return dataStore.setUser(user);
    });
};


module.exports.handleNewOrUpdatedUser = handleNewOrUpdatedUser;
module.exports.noopMessage = noopMessage;
