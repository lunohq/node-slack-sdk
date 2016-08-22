var expect = require('chai').expect;

var getMemoryDataStore = require('../../utils/client').getMemoryDataStore;
var messageHandlers = require('../../../lib/data-store/message-handlers');
var models = require('../../../lib/models');

var getRTMMessageFixture = require('../../fixtures').getRTMMessage;


describe('RTM API Message Handlers: Team Events', function () {
  var dataStore;

  beforeEach(function () {
    return getMemoryDataStore()
      .then(function (store) {
        dataStore = store;
      });
  });

  it('updates the team domain when a `team_domain_change` message is received', function () {
    return messageHandlers.team_domain_change(
      '', 'T0CHZBU59', dataStore, getRTMMessageFixture('team_domain_change'))
      .then(function () {
        return dataStore.getTeamById('T0CHZBU59');
      })
      .then(function (team) {
        expect(team.url).to.equal('https://sslack-api-test.slack.com');
        expect(team.domain).to.equal('sslack-api-test');
      });
  });

  it('updates the team name when a `team_rename` message is received', function () {
    return messageHandlers.team_rename(
      '',
      'T0CHZBU59',
      dataStore,
      getRTMMessageFixture('team_rename')
    )
      .then(function () {
        return dataStore.getTeamById('T0CHZBU59');
      })
      .then(function (team) {
        expect(team.name).to.equal('slack-api-test-test');
      });
  });

  it('updates a team preference when a `team_pref_change` message is received', function () {
    var prefChangeMsg = getRTMMessageFixture('team_pref_change');
    return messageHandlers.team_pref_change('', 'T0CHZBU59', dataStore, prefChangeMsg)
      .then(function () {
        return dataStore.getTeamById('T0CHZBU59');
      })
      .then(function (team) {
        expect(team.prefs[prefChangeMsg.name]).to.equal(prefChangeMsg.value);
      });
  });

  it('adds a new user to a team when a `team_join` message is received', function () {
    var teamJoinMsg = getRTMMessageFixture('team_join');
    return messageHandlers.team_join(dataStore, teamJoinMsg)
      .then(function () {
        return dataStore.getUserById('U0EV582MU');
      })
      .then(function (user) {
        expect(user).to.be.an.instanceof(models.User);
      });
  });

});
