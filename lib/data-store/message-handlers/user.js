/**
 * Handlers for all RTM `user_*` events.
 */

var fromPairs = require('lodash').fromPairs;
var Promise = require('bluebird');

var RTM_EVENTS = require('../../clients/events/rtm').EVENTS;

var helpers = require('./helpers');


/** {@link https://api.slack.com/events/user_typing|user_typing} */
var handleUserTyping = function handleUserTyping(dataStore, message) {
  var promises = [
    dataStore.getUserById(message.user),
    dataStore.getChannelById(message.channel)
  ];
  return Promise.all(promises)
    .then(function handleUserTypingPromiseInner(results) {
      var user = results[0];
      var channel = results[1];
      var ret = Promise.resolve();
      if (channel && user) {
        channel.startedTyping(user.id);
        ret = dataStore.setChannel(channel);
      } else {
        // TODO(leah): Logs for when channel / user aren't found.
      }
      return ret;
    });
};


/** {@link https://api.slack.com/events/pref_change|pref_change} */
var handlePrefChange = function handlePrefChange(activeUserId, activeTeamId, dataStore, message) {
  return dataStore.getUserById(activeUserId)
    .then(function handlePrefChangePromiseInner(obj) {
      var user = obj;
      var ret = Promise.resolve();
      if (user) {
        if (!user.prefs) {
          user.prefs = {}
        }
        user.prefs[message.name] = message.value;
        ret = dataStore.setUser(user);
      }
      return ret;
    });
};


var handlers = [
  [RTM_EVENTS.PREF_CHANGE, handlePrefChange],
  [RTM_EVENTS.USER_TYPING, handleUserTyping],
  [RTM_EVENTS.USER_CHANGE, helpers.handleNewOrUpdatedUser]
];


module.exports = fromPairs(handlers);
