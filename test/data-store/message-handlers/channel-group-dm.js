var expect = require('chai').expect;

var RTM_API_EVENTS = require('../../../lib/clients/events/rtm').EVENTS;
var getMemoryDataStore = require('../../utils/client').getMemoryDataStore;
var messageHandlers = require('../../../lib/data-store/message-handlers');

var getRTMMessageFixture = require('../../fixtures').getRTMMessage;
var rtmStartFixture = require('../../fixtures/rtm.start');


var ALICE_USER_ID = 'U0CJ5PC7L';
var TEST_CHANNEL_ID = 'C0CJ25PDM';
var TEST_GROUP_ID = 'G0CHZSXFW';


describe('RTM API Message Handlers: Channel, Group & DM Events', function () {

  var isArchivedChange = function (dataStore, event, id, expected) {
    messageHandlers[event](dataStore, getRTMMessageFixture(event));
    return dataStore.getChannelGroupOrDMById(id)
      .then(function (baseChannel) {
        expect(baseChannel.is_archived).to.equal(expected);
      });
  };

  var testBaseChannelMarked = function (dataStore, event, baseChannelId) {
    return dataStore.getChannelGroupOrDMById(baseChannelId)
      .then(function (baseChannel) {
        var originalUnreads;
        var newUnreads;

        baseChannel.history.push({ ts: 1 });
        baseChannel.history.push({ ts: 2 });

        originalUnreads = baseChannel.recalcUnreads();
        expect(originalUnreads).to.equal(3);

        return messageHandlers[event](dataStore, getRTMMessageFixture(event))
          .then(function () {
            newUnreads = baseChannel.recalcUnreads();
            expect(newUnreads).to.equal(0);
          });
      });
  };

  var testBaseChannelRename = function (dataStore, event, baseChannelId, expected) {
    messageHandlers[event](dataStore, getRTMMessageFixture(event));
    return dataStore.getChannelGroupOrDMById(baseChannelId)
      .then(function (baseChannel) {
        expect(baseChannel.name).to.equal(expected);
      });
  };

  var testBaseChannelJoined = function (dataStore, event, baseChannelId, expectedUserId) {
    messageHandlers[event](dataStore, getRTMMessageFixture(event));
    return dataStore.getChannelGroupOrDMById(baseChannelId)
      .then(function (baseChannel) {
        expect(baseChannel.members).to.have.length(2);
        expect(baseChannel).to.have.deep.property('members[1]', expectedUserId);
      });
  };

  var testBaseChannelLeft = function (dataStore, event, baseChannelId, expectedUserId) {
    messageHandlers[event](ALICE_USER_ID, '', dataStore, getRTMMessageFixture(event));
    return dataStore.getChannelGroupOrDMById(baseChannelId)
      .then(function (baseChannel) {
        expect(baseChannel.members).to.not.contain(expectedUserId);
        return baseChannel;
      });
  };

  describe('`channel_xxx` events', function () {
    var dataStore;

    beforeEach(function () {
      return getMemoryDataStore()
        .then(function (store) {
          dataStore = store;
        });
    });

    it('sets isArchived to true when a `channel_archive` message is received', function () {
      return isArchivedChange(dataStore, 'channel_archive', TEST_CHANNEL_ID, true);
    });

    it('sets isArchived to false when a `channel_unarchive` message is received', function () {
      return isArchivedChange(dataStore, 'channel_unarchive', TEST_CHANNEL_ID, false);
    });

    it('renames a channel when a `channel_rename` message is received', function () {
      return testBaseChannelRename(
        dataStore,
        'channel_rename',
        TEST_CHANNEL_ID,
        'test-channel-rename'
      );
    });

    it('creates a new channel when a `channel_created` message is received', function () {
      messageHandlers.channel_created(dataStore, getRTMMessageFixture('channel_created'));
      return dataStore.getChannelById('C0F3Q8LH5')
        .then(function (channel) {
          expect(channel).to.not.equal(undefined);
        });
    });

    it('deletes a channel when a `channel_deleted` message is received', function () {
      messageHandlers.channel_deleted(dataStore, getRTMMessageFixture('channel_deleted'));
      return dataStore.getChannelById(TEST_CHANNEL_ID)
        .then(function (channel) {
          expect(channel).to.equal(undefined);
        });
    });

    it('creates a Channel, replacing the existing one, on `channel_joined` msg', function () {
      return testBaseChannelJoined(dataStore, 'channel_joined', TEST_CHANNEL_ID, 'U0F3LFX6K');
    });

    it('removes a user from a channel when a `channel_left` message is received', function () {
      return testBaseChannelLeft(dataStore, 'channel_left', TEST_CHANNEL_ID, 'U0F3LFX6K')
        .then(function (channel) {
          expect(channel.is_member).to.equal(false);
        });
    });

    it('marks the channel as read when a `channel_marked` message is received', function () {
      return testBaseChannelMarked(dataStore, 'channel_marked', TEST_CHANNEL_ID);
    });

  });

  describe('`group_xxx` events', function () {
    var dataStore;

    beforeEach(function () {
      return getMemoryDataStore()
        .then(function (store) {
          dataStore = store;
        });
    });

    it('sets isArchived to true when a `group_archive` message is received', function () {
      return isArchivedChange(dataStore, 'group_archive', TEST_GROUP_ID, true);
    });

    it('sets isArchived to false when a `group_unarchive` message is received', function () {
      return isArchivedChange(dataStore, 'group_unarchive', TEST_GROUP_ID, false);
    });

    it('marks the group as read when a `group_marked` message is received', function () {
      return testBaseChannelMarked(dataStore, 'group_marked', TEST_GROUP_ID);
    });

    it('renames a group when a `group_rename` message is received', function () {
      return testBaseChannelRename(dataStore, 'group_rename', TEST_GROUP_ID, 'test-group-rename');
    });

    it('creates a Group, replacing the existing one, on `group_joined` msg', function () {
      return testBaseChannelJoined(dataStore, 'group_joined', TEST_GROUP_ID, 'U0F3LFX6K');
    });

    describe('`group_left`', function () {
      it('removes the user from a group when a `group_left` message is received', function () {
        return testBaseChannelLeft(dataStore, 'group_left', TEST_GROUP_ID, 'U0F3LFX6K');
      });

      it('marks the group as archived when the last user leaves', function () {
        return testBaseChannelLeft(dataStore, 'group_left', TEST_GROUP_ID, 'U0F3LFX6K')
          .then(function (group) {
            expect(group.is_archived).to.equal(true);
          });
      });
    });

  });

  describe('`im_xxx` events', function () {
    var dataStore;

    var testDMOpenStatus = function (store, isOpen, event) {
      return store.getDMById(rtmStartFixture.ims[0].id)
        .then(function (obj) {
          var dm = obj;
          dm.is_open = isOpen;
          return store.setDM(dm);
        })
        .then(function () {
          messageHandlers[event](store, getRTMMessageFixture(event));
          return store.getDMById(rtmStartFixture.ims[0].id);
        })
        .then(function (dm) {
          expect(dm.is_open).to.equal(isOpen);
        });
    };

    beforeEach(function () {
      return getMemoryDataStore()
        .then(function (store) {
          dataStore = store;
        });
    });

    it(
      'sets isOpen to true on a DM channel when an `im_open` message is received',
      function () {
        return testDMOpenStatus(dataStore, true, RTM_API_EVENTS.IM_OPEN);
      }
    );

    it(
      'sets isOpen to false on a DM channel when an `im_close` message is received',
      function () {
        return testDMOpenStatus(dataStore, false, RTM_API_EVENTS.IM_CLOSE);
      }
    );

    it('adds a new DM object when an `im_created` message is received', function () {
      messageHandlers.im_created(dataStore, getRTMMessageFixture('im_created'));
      return dataStore.getDMById('D0CHZQWNP')
        .then(function (dm) {
          expect(dm).to.not.equal(undefined);
        });
    });

    it('marks the DM channel as read when an `im_marked` message is received', function () {
      return testBaseChannelMarked(dataStore, 'im_marked', 'D0CHZQWNP');
    });

  });

});
