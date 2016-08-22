/**
 * Handlers for all RTM `channel_` events.
 */

var fromPairs = require('lodash').fromPairs;
var Promise = require('bluebird');

var RTM_EVENTS = require('../../clients/events/rtm').EVENTS;

var baseChannelHandlers = require('./base-channel');
var helpers = require('./helpers');
var models = require('../../models');


var addChannel = function addChannel(dataStore, message) {
  var newChannel = new models.Channel(message);
  return dataStore.setChannel(newChannel);
};


/** {@link https://api.slack.com/events/channel_created|channel_created} */
var handleChannelCreated = function handleChannelCreated(dataStore, message) {
  return addChannel(dataStore, message.channel);
};


/** {@link https://api.slack.com/events/channel_deleted|channel_deleted} */
var handleChannelDeleted = function handleChannelDeleted(dataStore, message) {
  var channelId = message.channel;
  return dataStore.removeChannel(channelId);
};


/** {@link https://api.slack.com/events/channel_joined|channel_joined} */
var handleChannelJoined = function handleChannelJoined(dataStore, message) {
  return dataStore.upsertChannel(message.channel);
};

/** {@link https://api.slack.com/events/channel_left|channel_left} */
var handleChannelLeft = function handleChannelLeft(activeUserId, activeTeamId, dataStore, message) {
  var promises = [];
  promises.push(baseChannelHandlers.handleLeave(activeUserId, activeTeamId, dataStore, message));
  promises.push(
    dataStore.getChannelById(message.channel)
      .then(function handleChannelLeftPromiseInner(obj) {
        var channel = obj;
        var ret = Promise.resolve();
        if (channel) {
          channel.is_member = false;
          ret = dataStore.setChannel(channel);
        }
        return ret;
      })
  );
  return Promise.all(promises);
};

var handlers = [
  [RTM_EVENTS.CHANNEL_ARCHIVE, baseChannelHandlers.handleArchive],
  [RTM_EVENTS.CHANNEL_CREATED, handleChannelCreated],
  [RTM_EVENTS.CHANNEL_DELETED, handleChannelDeleted],
  [RTM_EVENTS.CHANNEL_HISTORY_CHANGED, helpers.noopMessage],
  [RTM_EVENTS.CHANNEL_JOINED, handleChannelJoined],
  [RTM_EVENTS.CHANNEL_LEFT, handleChannelLeft],
  [RTM_EVENTS.CHANNEL_MARKED, baseChannelHandlers.handleChannelGroupOrDMMarked],
  [RTM_EVENTS.CHANNEL_RENAME, baseChannelHandlers.handleRename],
  [RTM_EVENTS.CHANNEL_UNARCHIVE, baseChannelHandlers.handleUnarchive]
];


module.exports = fromPairs(handlers);
