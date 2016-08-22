var expect = require('chai').expect;

var getMemoryDataStore = require('../../utils/client').getMemoryDataStore;
var messageHandlers = require('../../../lib/data-store/message-handlers');

var getRTMMessageFixture = require('../../fixtures').getRTMMessage;

var ALICE_USER_ID = 'U0CJ5PC7L';
var GENERAL_CHANNEL_ID = 'C0CHZA86Q';


describe('RTM API Message Handlers: User Events', function () {
  var dataStore;

  beforeEach(function () {
    return getMemoryDataStore()
      .then(function (store) {
        dataStore = store;
      });
  });

  it('updates a user preference when `pref_change` is received', function () {
    var prefChangeMsg = getRTMMessageFixture('pref_change');
    return messageHandlers.pref_change(ALICE_USER_ID, '', dataStore, prefChangeMsg)
      .then(function () {
        return dataStore.getUserById(ALICE_USER_ID);
      })
      .then(function (user) {
        expect(user.prefs[prefChangeMsg.name]).to.equal(prefChangeMsg.value);
      });
  });

  it('updates a channel, marking a user as typing when `user_typing` is received', function () {
    return dataStore.getChannelById(GENERAL_CHANNEL_ID)
      .then(function (channel) {
        var userTypingMsg = getRTMMessageFixture('user_typing');
        return messageHandlers.user_typing(dataStore, userTypingMsg)
          .then(function () {
            expect(channel._typing[userTypingMsg.user]).to.not.equal(undefined);
          });
      });
  });

  it('adds or updates a user when a `user_change` event is received', function () {
    return messageHandlers.user_change(dataStore, getRTMMessageFixture('user_change'))
      .then(function () {
        return dataStore.getUserById('U0CJ1TWKX');
      })
      .then(function (user) {
        expect(user.profile.email).to.equal('leah+slack-api-test-user-change-test@slack-corp.com');
      });
  });

});
