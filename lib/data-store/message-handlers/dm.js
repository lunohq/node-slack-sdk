/**
 * Handlers for all RTM `im_` events.
 */

var fromPairs = require('lodash').fromPairs;
var Promise = require('bluebird');

var RTM_EVENTS = require('../../clients/events/rtm').EVENTS;
var baseChannelHandlers = require('./base-channel');
var helpers = require('./helpers');
var models = require('../../models');


/** {@link https://api.slack.com/events/im_created|im_created} */
var handleDMCreated = function handleDMCreated(dataStore, message) {
  var dm = new models.DM(message.channel);
  return dataStore.setDM(dm);
};


var changeDMOpenness = function changeDMOpenness(dataStore, message, isOpen) {
  return dataStore.getDMById(message.channel)
    .then(function changeDMOpennessPromiseInner(obj) {
      var dm = obj;
      var ret = Promise.resolve();
      if (dm) {
        dm.is_open = isOpen;
        ret = dataStore.setDM(dm);
      }
      return ret;
    });
};


/** {@link https://api.slack.com/events/im_close|im_close} */
var handleDMClose = function handleDMClose(dataStore, message) {
  return changeDMOpenness(dataStore, message, false);
};


/** {@link https://api.slack.com/events/im_open|im_open} */
var handleDMOpen = function handleDMOpen(dataStore, message) {
  return changeDMOpenness(dataStore, message, true);
};


var handlers = [
  [RTM_EVENTS.IM_CREATED, handleDMCreated],
  [RTM_EVENTS.IM_MARKED, baseChannelHandlers.handleChannelGroupOrDMMarked],
  [RTM_EVENTS.IM_OPEN, handleDMOpen],
  [RTM_EVENTS.IM_CLOSE, handleDMClose],
  [RTM_EVENTS.IM_HISTORY_CHANGED, helpers.noopMessage]
];


module.exports = fromPairs(handlers);
