var expect = require('chai').expect;

var getMemoryDataStore = require('../../utils/client').getMemoryDataStore;
var messageHandlers = require('../../../lib/data-store/message-handlers');

var getRTMMessageFixture = require('../../fixtures').getRTMMessage;

var GENERAL_CHANNEL_ID = 'C0CHZA86Q';


describe('RTM API Message Handlers: Reaction Events', function () {
  var dataStore;

  beforeEach(function () {
    return getMemoryDataStore()
      .then(function (store) {
        dataStore = store;
      });
  });

  it('should add a reaction when a `reaction_added` event is received', function () {
    return dataStore.getChannelById(GENERAL_CHANNEL_ID)
      .then(function (channel) {
        var message = channel.getMessageByTs('1444959632.000002');
        return messageHandlers.reaction_added(dataStore, getRTMMessageFixture('reaction_added'))
          .then(function () {
            expect(message.reactions).to.have.length(1);
            expect(message.reactions[0]).to.have.property('name', '+1');
          });
      });
  });

  it('should remove a reaction when a `reaction_removed` event is received', function () {
    return dataStore.getChannelById(GENERAL_CHANNEL_ID)
      .then(function (channel) {
        var message = channel.getMessageByTs('1444959632.000002');
        return messageHandlers.reaction_added(dataStore, getRTMMessageFixture('reaction_added'))
          .then(function () {
            expect(message.reactions[0]).to.have.property('name', '+1');
            return messageHandlers.reaction_removed(
              dataStore,
              getRTMMessageFixture('reaction_removed')
            )
              .then(function () {
                expect(message.reactions).to.have.length(0);
              });
          });
      });
  });

});
