/**
 * In memory data store for caching information from the Slack API.
 */

var assign = require('lodash').assign;
var find = require('lodash').find;
var has = require('lodash').has;
var inherits = require('inherits');
var Promise = require('bluebird');

var SlackDataStore = require('./data-store');
var models = require('../models');


/**
 *
 * @constructor
 */
function SlackMemoryDataStore(opts) {
  SlackDataStore.call(this, opts);

  /**
   *
   * @type {Object}
   */
  this.users = {};


  /**
   *
   * @type {Object}
   */
  this.channels = {};


  /**
   *
   * @type {Object}
   */
  this.dms = {};


  /**
   *
   * @type {Object}
   */
  this.groups = {};


  /**
   *
   * @type {Object}
   */
  this.bots = {};


  /**
   *
   * @type {Object}
   */
  this.teams = {};
}

inherits(SlackMemoryDataStore, SlackDataStore);


/** @inheritdoc */
SlackMemoryDataStore.prototype.clear = function clear() {
  this.users = {};
  this.channels = {};
  this.dms = {};
  this.groups = {};
  this.bots = {};
  this.teams = {};
  return Promise.resolve();
};


/** @inheritdoc */
SlackMemoryDataStore.prototype.getUserById = function getUserById(userId) {
  return Promise.resolve(this.users[userId]);
};


/** @inheritdoc */
SlackMemoryDataStore.prototype.getUserByName = function getUserByName(name) {
  return Promise.resolve(find(this.users, ['name', name]));
};


/** @inheritdoc */
SlackMemoryDataStore.prototype.getUserByEmail = function getUserByEmail(email) {
  return Promise.resolve(find(this.users, { profile: { email: email } }));
};


/** @inheritdoc */
SlackMemoryDataStore.prototype.getUserByBotId = function getUserByBotId(botId) {
  return Promise.resolve(find(this.users, { profile: { bot_id: botId } }));
};


/** @inheritdoc */
SlackMemoryDataStore.prototype.getChannelById = function getChannelById(channelId) {
  return Promise.resolve(this.channels[channelId]);
};


/** @inheritdoc */
SlackMemoryDataStore.prototype.getChannelByName = function getChannelByName(name) {
  var transformedName = name.replace(/^#/, '');
  return Promise.resolve(find(this.channels, ['name', transformedName]));
};


/** @inheritdoc */
SlackMemoryDataStore.prototype.getGroupById = function getGroupById(groupId) {
  return Promise.resolve(this.groups[groupId]);
};


/** @inheritdoc */
SlackMemoryDataStore.prototype.getGroupByName = function getGroupByName(name) {
  return Promise.resolve(find(this.groups, ['name', name]));
};


/** @inheritdoc */
SlackMemoryDataStore.prototype.getDMById = function getDMById(dmId) {
  return Promise.resolve(this.dms[dmId]);
};


/** @inheritdoc */
SlackMemoryDataStore.prototype.getDMByName = function getDMByName(name) {
  var self = this;
  return this.getUserByName(name)
    .then(function getDMByNamePromiseInner(user) {
      return Promise.resolve(find(self.dms, ['user', user.id]));
    });
};


/** @inheritdoc */
SlackMemoryDataStore.prototype.getBotById = function getBotById(botId) {
  return Promise.resolve(this.bots[botId]);
};


/** @inheritdoc */
SlackMemoryDataStore.prototype.getBotByName = function getBotByName(name) {
  return Promise.resolve(find(this.bots, ['name', name]));
};


/** @inheritdoc */
SlackMemoryDataStore.prototype.getBotByUserId = function getBotByUserId(userId) {
  var self = this;
  return this.getUserById(userId)
    .then(function getBotByUserIdPromiseInner(user) {
      var bot;
      var ret;
      if (user) {
        ret = self.getBotById(user.profile.bot_id);
      } else {
        ret = Promise.resolve(bot);
      }
      return ret;
    });
};

/** @inheritdoc */
SlackMemoryDataStore.prototype.getTeamById = function getTeamById(teamId) {
  return Promise.resolve(this.teams[teamId]);
};


/**
 * Returns the unread count for all objects: channels, groups etc.
 */
SlackMemoryDataStore.prototype.getUnreadCount = function getUnreadCount() {
};


// ###############################################
// Setters
// ###############################################


/** @inheritdoc */
SlackMemoryDataStore.prototype.setChannel = function setChannel(channel) {
  this.channels[channel.id] = channel;
  return Promise.resolve();
};


/** @inheritdoc */
SlackMemoryDataStore.prototype.setGroup = function setGroup(group) {
  this.groups[group.id] = group;
  return Promise.resolve();
};


/** @inheritdoc */
SlackMemoryDataStore.prototype.setDM = function setDM(dm) {
  this.dms[dm.id] = dm;
  return Promise.resolve();
};


/** @inheritdoc */
SlackMemoryDataStore.prototype.setUser = function setUser(user) {
  this.users[user.id] = user;
  return Promise.resolve();
};


/** @inheritdoc */
SlackMemoryDataStore.prototype.setBot = function setBot(bot) {
  this.bots[bot.id] = bot;
  return Promise.resolve();
};


/** @inheritdoc */
SlackMemoryDataStore.prototype.setTeam = function setTeam(team) {
  this.teams[team.id] = team;
  return Promise.resolve();
};


// ###############################################
// Upserts
// ###############################################


/** @inheritdoc */
SlackMemoryDataStore.prototype.upsertChannel = function upsertChannel(channel) {
  var self = this;
  var ret;
  if (has(this.channels, channel.id)) {
    ret = this.getChannelById(channel.id)
      .then(function upsertChannelPromiseInner(model) {
        model.update(channel);
        return self.setChannel(model);
      });
  } else {
    ret = this.setChannel(new models.Channel(channel));
  }
  return ret;
};


/** @inheritdoc */
SlackMemoryDataStore.prototype.upsertGroup = function upsertGroup(group) {
  var self = this;
  var ret;
  if (has(this.groups, group.id)) {
    ret = this.getGroupById(group.id)
      .then(function upsertGroupPromiseInner(model) {
        model.update(group);
        return self.setGroup(model);
      });
  } else {
    ret = this.setGroup(new models.Group(group));
  }
  return ret;
};


/** @inheritdoc */
SlackMemoryDataStore.prototype.upsertDM = function upsertDM(dm) {
  var self = this;
  var ret;
  if (has(this.dms, dm.id)) {
    ret = this.getDMById(dm.id)
      .then(function upsertDMPromiseInner(model) {
        model.update(dm);
        return self.setDM(model);
      });
  } else {
    ret = this.setDM(new models.DM(dm));
  }
  return ret;
};


/** @inheritdoc */
SlackMemoryDataStore.prototype.upsertUser = function upsertUser(user) {
  var self = this;
  var ret;
  if (has(this.users, user.id)) {
    ret = this.getUserById(user.id)
      .then(function upsertUserPromiseInner(model) {
        model.update(user);
        return self.setUser(model);
      });
  } else {
    ret = this.setUser(new models.User(user));
  }
  return ret;
};


/** @inheritdoc */
SlackMemoryDataStore.prototype.upsertBot = function upsertBot(bot) {
  var self = this;
  var ret;
  if (has(this.bots, bot.id)) {
    ret = this.getBotById(bot.id)
      .then(function upsertBotPromiseInner(data) {
        return self.setBot(assign(data, bot));
      });
  } else {
    ret = this.setBot(bot);
  }
  return ret;
};


/** @inheritdoc */
SlackMemoryDataStore.prototype.upsertTeam = function upsertTeam(team) {
  var self = this;
  var ret;
  if (has(this.teams, team.id)) {
    ret = this.getTeamById(team.id)
      .then(function upsertTeamPromiseInner(data) {
        return self.setTeam(assign(data, team));
      });
  } else {
    ret = this.setTeam(team);
  }
  return ret;
};


// ###############################################
// Deletion methods
// ###############################################


/** @inheritdoc */
SlackMemoryDataStore.prototype.removeChannel = function removeChannel(channelId) {
  delete this.channels[channelId];
  return Promise.resolve();
};


/** @inheritdoc */
SlackMemoryDataStore.prototype.removeGroup = function removeGroup(groupId) {
  delete this.groups[groupId];
  return Promise.resolve();
};


/** @inheritdoc */
SlackMemoryDataStore.prototype.removeDM = function removeDM(dmId) {
  delete this.dms[dmId];
  return Promise.resolve();
};


/** @inheritdoc */
SlackMemoryDataStore.prototype.removeUser = function removeUser(userId) {
  delete this.users[userId];
  return Promise.resolve();
};


/** @inheritdoc */
SlackMemoryDataStore.prototype.removeBot = function removeBot(botId) {
  delete this.bots[botId];
  return Promise.resolve();
};


/** @inheritdoc */
SlackMemoryDataStore.prototype.removeTeam = function removeTeam(teamId) {
  delete this.teams[teamId];
  return Promise.resolve();
};


module.exports = SlackMemoryDataStore;
