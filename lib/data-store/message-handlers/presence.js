/**
 * Event handlers for RTM presence change events.
 */

var fromPairs = require('lodash').fromPairs;

var RTM_EVENTS = require('../../clients/events/rtm').EVENTS;


/** {@link https://api.slack.com/events/manual_presence_change|manual_presence_change} */
var handleManualPresenceChange = function handleManualPresenceChange(
  activeUserId, activeTeamId, dataStore, message) {
  return dataStore.getUserById(activeUserId)
    .then(function handleManualPresenceChangePromiseInner(obj) {
      var user = obj;
      user.presence = message.presence;
      return dataStore.setUser(user);
    });
};


/** {@link https://api.slack.com/events/presence_change|presence_change} */
var handlePresenceChange = function handlePresenceChange(dataStore, message) {
  return dataStore.getUserById(message.user)
    .then(function handlePresenceChangePromiseInner(obj) {
      var user = obj;
      user.presence = message.presence;
      return dataStore.setUser(user);
    });
};


var handlers = [
  [RTM_EVENTS.MANUAL_PRESENCE_CHANGE, handleManualPresenceChange],
  [RTM_EVENTS.PRESENCE_CHANGE, handlePresenceChange]
];


module.exports = fromPairs(handlers);
