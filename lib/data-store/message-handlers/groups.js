/**
 * Handlers for all RTM `group_` events.
 */

var fromPairs = require('lodash').fromPairs;
var Promise = require('bluebird');

var RTM_EVENTS = require('../../clients/events/rtm').EVENTS;

var baseChannelHandlers = require('./base-channel');
var helpers = require('./helpers');
var models = require('../../models');


/** {@link https://api.slack.com/events/group_joined|group_joined} */
var handleGroupJoined = function handleGroupJoined(dataStore, message) {
  var group = new models.Group(message.channel);
  return dataStore.setGroup(group);
};


/**
 * {@link https://api.slack.com/events/group_left|group_left}
 */
var handleGroupLeave = function handleGroupLeave(activeUserId, activeTeamId, dataStore, message) {
  var promises = [];
  promises.push(baseChannelHandlers.handleLeave(activeUserId, activeTeamId, dataStore, message));

  promises.push(
    dataStore.getGroupById(message.channel)
      .then(function handleGroupLeavePromiseInner(obj) {
        var group = obj;
        var ret = Promise.resolve();
        if (group) {
          // TODO(leah): Maybe this should remove the group?
          if (group.members.length === 0) {
            group.is_archived = true;
          }
          ret = dataStore.setGroup(group);
        }
        return ret;
      })
  );
  return Promise.all(promises);
};


var handlers = [
  [RTM_EVENTS.GROUP_ARCHIVE, baseChannelHandlers.handleArchive],
  [RTM_EVENTS.GROUP_CLOSE, helpers.noopMessage],
  [RTM_EVENTS.GROUP_JOINED, handleGroupJoined],
  [RTM_EVENTS.GROUP_LEFT, handleGroupLeave],
  [RTM_EVENTS.GROUP_MARKED, baseChannelHandlers.handleChannelGroupOrDMMarked],
  [RTM_EVENTS.GROUP_OPEN, helpers.noopMessage],
  [RTM_EVENTS.GROUP_UNARCHIVE, baseChannelHandlers.handleUnarchive],
  [RTM_EVENTS.GROUP_RENAME, baseChannelHandlers.handleRename],
  [RTM_EVENTS.GROUP_HISTORY_CHANGED, helpers.noopMessage]
];


module.exports = fromPairs(handlers);
