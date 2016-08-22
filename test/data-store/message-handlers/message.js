var expect = require('chai').expect;

var getMemoryDataStore = require('../../utils/client').getMemoryDataStore;
var messageHandlers = require('../../../lib/data-store/message-handlers');

var getRTMMessageFixture = require('../../fixtures').getRTMMessage;

var TEST_CHANNEL_ID = 'C0CJ25PDM';


describe('RTM API Message Handlers: Message Events', function () {
  var dataStore;

  var testMessageAdd = function (store, event, baseChannelId, expectedSubtype) {
    messageHandlers['message::rtm_client_add_message'](store, getRTMMessageFixture(event));
    return store.getChannelGroupOrDMById(baseChannelId)
      .then(function (baseChannel) {
        expect(baseChannel.history[baseChannel.history.length - 1])
          .to.have.property('subtype', expectedSubtype);
        expect(baseChannel.history).to.have.length(2);
      });
  };

  var testBaseChannelJoin = function (store, event, baseChannelId, expectedUser) {
    messageHandlers[event](store, getRTMMessageFixture(event));
    return store.getChannelGroupOrDMById(baseChannelId)
      .then(function (baseChannel) {
        expect(baseChannel.members).to.contain(expectedUser);
        expect(baseChannel.history).to.have.length(2);
      });
  };

  var testBaseChannelLeave = function (store, event, baseChannelId, expectedUser) {
    messageHandlers[event](store, getRTMMessageFixture(event));
    return store.getChannelGroupOrDMById(baseChannelId)
      .then(function (baseChannel) {
        expect(baseChannel.members).to.not.contain(expectedUser);
        expect(baseChannel.history).to.have.length(2);
      });
  };

  beforeEach(function () {
    return getMemoryDataStore()
      .then(function (store) {
        dataStore = store;
      });
  });

  it(
    'adds a user to a channel and updates msg history when a `channel_join` msg is received',
    function () {
      return testBaseChannelJoin(dataStore, 'message::channel_join', TEST_CHANNEL_ID, 'U0F3LFX6K');
    }
  );

  it(
    'adds a user to a group and updates msg history when a `group_join` msg is received',
    function () {
      return testBaseChannelJoin(dataStore, 'message::group_join', 'G0CHZSXFW', 'U0F3LFX6K');
    }
  );

  it(
    'removes a user from a channel and updates msg history when a `channel_leave` msg is received',
    function () {
      return testBaseChannelLeave(
        dataStore,
        'message::channel_leave',
        TEST_CHANNEL_ID,
        'U0F3LFX6K'
      );
    }
  );

  it(
    'removes a user from a group and updates msg history when a `group_leave` msg is received',
    function () {
      return testBaseChannelLeave(dataStore, 'message::group_leave', 'G0CHZSXFW', 'U0F3LFX6K');
    }
  );

  it('adds to to history when a message without a custom handler is received', function () {
    return testMessageAdd(
      dataStore,
      'message::channel_archive',
      TEST_CHANNEL_ID,
      'channel_archive'
    );
  });

  it('deletes a message when a `message_delete` message is received', function () {
    var initialMsg = {
      type: 'message',
      channel: 'C0CJ25PDM',
      user: 'U0F3LFX6K',
      text: "I'm going to delete this message Carol",
      ts: '1448496776.000003',
      team: 'T0CHZBU59'
    };
    return dataStore.getChannelById(TEST_CHANNEL_ID)
      .then(function (channel) {
        channel.addMessage(initialMsg);
        return messageHandlers['message::message_deleted'](
          dataStore, getRTMMessageFixture('message::message_deleted'));
      })
      .then(function () {
        return dataStore.getChannelById(TEST_CHANNEL_ID);
      })
      .then(function (channel) {
        // TODO(leah): This should be 2, but "latest" is alawys being added
        // when we do an upsert
        expect(channel.history).to.have.length(3);
        expect(channel.history[1]).to.have.property('subtype', 'message_deleted');
      });
  });

  it('updates a message when a `message_changed` message is received', function () {
    var initialMsg = {
      type: 'message',
      channel: 'C0CJ25PDM',
      user: 'U0F3LFX6K',
      text: 'Howdy Carol',
      ts: '1448496754.000002',
      team: 'T0CHZBU59'
    };
    return dataStore.getChannelById(TEST_CHANNEL_ID)
      .then(function (channel) {
        channel.addMessage(initialMsg);
        messageHandlers['message::message_changed'](
          dataStore, getRTMMessageFixture('message::message_changed'))
            .then(function () {
              // TODO(leah): This should be 3, but "latest" is alawys being added
              // when we do an upsert
              expect(channel.history).to.have.length(4);
              expect(channel.history[1]).to.have.property('text', 'Hi carol! :simple_smile:');
            });
      });
  });

});
