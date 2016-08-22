/**
 * Event handlers for RTM presence change events.
 */

var fromPairs = require('lodash').fromPairs;
var Promise = require('bluebird');

var RTM_EVENTS = require('../../clients/events/rtm').EVENTS;


/** {@link https://api.slack.com/events/manual_presence_change|manual_presence_change} */
var handleManualPresenceChange = function handleManualPresenceChange(
  activeUserId, activeTeamId, dataStore, message) {
  return dataStore.getUserById(activeUserId)
    .then(function handleManualPresenceChangePromiseInner(obj) {
      var ret = Promise.resolve();
      var user = obj;
      if (user) {
        user.presence = message.presence;
        ret = dataStore.setUser(user);
      }
      return ret;
    });
};


/** {@link https://api.slack.com/events/presence_change|presence_change} */
var handlePresenceChange = function handlePresenceChange(dataStore, message) {
  return dataStore.getUserById(message.user)
    .then(function handlePresenceChangePromiseInner(obj) {
      var ret = Promise.resolve();
      var user = obj;
      if (user) {
        user.presence = message.presence;
        ret = dataStore.setUser(user);
      }
      return ret;
    });
};


var handlers = [
  [RTM_EVENTS.MANUAL_PRESENCE_CHANGE, handleManualPresenceChange],
  [RTM_EVENTS.PRESENCE_CHANGE, handlePresenceChange]
];


module.exports = fromPairs(handlers);
