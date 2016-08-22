var expect = require('chai').expect;
var Promise = require('bluebird');
var before = require('mocha').before;

var getMemoryDataStore = require('../utils/client').getMemoryDataStore;


describe('MemoryDataStore', function () {

  describe('#cacheRtmStart()', function () {

    it('caches the RTM start response', function (done) {
      getMemoryDataStore()
        .then(function (dataStore) {
          var promises = [
            dataStore.getTeamById('T0CHZBU59').then(function (team) {
              expect(team.name).to.equal('slack-api-test');
            }),
            dataStore.getUserById('U0CJ5PC7L').then(function (user) {
              expect(user.name).to.equal('alice');
            }),
            dataStore.getChannelById('C0CJ25PDM').then(function (channel) {
              expect(channel.name).to.equal('test');
            }),
            dataStore.getDMById('D0CHZQWNP').then(function (dm) {
              expect(dm.latest.text).to.equal('hi alice!');
            }),
            dataStore.getGroupById('G0CHZSXFW').then(function (group) {
              expect(group.name).to.equal('private');
            }),
            dataStore.getBotById('B0CJ5FF1P').then(function (bot) {
              expect(bot.name).to.equal('gdrive');
            })
          ];
          Promise.all(promises)
            .then(function () {
              done();
            });
        });
    });

  });

  describe('#getDMByName', function () {
    it('should get a DM with another user when passed the name of that user', function (done) {
      getMemoryDataStore()
        .then(function (dataStore) {
          dataStore.getDMByName('bob')
            .then(function (dm) {
              expect(dm.id).to.equal('D0CHZQWNP');
              done();
            });
        });
    });
  });

  describe('#getChannelByName()', function () {
    it('should get a channel by name', function (done) {
      getMemoryDataStore()
        .then(function (dataStore) {
          dataStore.getChannelByName('test')
            .then(function (channel) {
              expect(channel.name).to.equal('test');
              done();
            });
        });
    });

    it('should get a channel by #name (prefixed with #)', function (done) {
      getMemoryDataStore()
        .then(function (dataStore) {
          dataStore.getChannelByName('#test')
            .then(function (channel) {
              expect(channel.name).to.equal('test');
              done();
            });
        });
    });
  });

  describe('#getChannelGroupOrIMById()', function () {
    var dataStore;

    before(function (done) {
      getMemoryDataStore()
        .then(function (store) {
          dataStore = store;
          done();
        });
    });

    it('should get a channel by id', function (done) {
      dataStore.getChannelGroupOrDMById('C0CJ25PDM')
        .then(function (obj) {
          expect(obj).to.not.equal(undefined);
          done();
        });
    });

    it('should get a group by id', function (done) {
      dataStore.getChannelGroupOrDMById('G0CHZSXFW')
        .then(function (obj) {
          expect(obj).to.not.equal(undefined);
          done();
        });
    });

    it('should get an IM by id', function (done) {
      dataStore.getChannelGroupOrDMById('D0CHZQWNP')
        .then(function (obj) {
          expect(obj).to.not.equal(undefined);
          done();
        });
    });
  });

  describe('#getUserByEmail()', function () {
    var dataStore;

    before(function (done) {
      getMemoryDataStore()
        .then(function (store) {
          dataStore = store;
          done();
        });
    });

    it('should get a user by email', function (done) {
      dataStore.getUserByEmail('leah+slack-api-test-alice@slack-corp.com')
        .then(function (user) {
          expect(user.id).to.equal('U0CJ5PC7L');
          done();
        });
    });

    it('should return undefined if no users with email is not found', function (done) {
      dataStore.getUserByEmail('NOT-leah+slack-api-test-bob@slack-corp.com')
        .then(function (user) {
          expect(user).to.equal(undefined);
          done();
        });
    });
  });

  describe('#getUserByName()', function () {
    var dataStore;

    before(function (done) {
      getMemoryDataStore()
        .then(function (store) {
          dataStore = store;
          done();
        });
    });

    it('should get a user by name', function (done) {
      dataStore.getUserByName('alice')
        .then(function (user) {
          expect(user.id).to.equal('U0CJ5PC7L');
          done();
        });
    });

    it('should return undefined if no users with name is not found', function (done) {
      dataStore.getUserByEmail('NOTalice')
        .then(function (user) {
          expect(user).to.equal(undefined);
          done();
        });
    });
  });

  describe('#getUserByBotId()', function () {
    var dataStore;

    before(function (done) {
      getMemoryDataStore()
        .then(function (store) {
          dataStore = store;
          done();
        });
    });

    it('should get a bot user by bot ID', function (done) {
      dataStore.getUserByBotId('B0EV07BEH')
        .then(function (bot) {
          expect(bot.id).to.equal('U0EUYE1E0');
          done();
        });
    });

    it('should return undefined if no users with a bot id are found', function (done) {
      dataStore.getUserByEmail('B00000000')
        .then(function (bot) {
          expect(bot).to.equal(undefined);
          done();
        });
    });
  });

  describe('#getBotByUserId()', function () {
    var dataStore;

    before(function (done) {
      getMemoryDataStore()
        .then(function (store) {
          dataStore = store;
          done();
        });
    });

    it('should get a bot user by user ID', function (done) {
      dataStore.getBotByUserId('U0EUYE1E0')
        .then(function (bot) {
          expect(bot.id).to.equal('B0EV07BEH');
          done();
        });
    });

    it('should return undefined if no bots with a user id are found', function (done) {
      dataStore.getBotByUserId('U00000000')
        .then(function (bot) {
          expect(bot).to.equal(undefined);
          done();
        });
    });
  });

  describe('#clear()', function () {
    it('should re-set the objects when clear() is called', function (done) {
      getMemoryDataStore()
        .then(function (dataStore) {
          dataStore.clear()
            .then(function () {
              expect(dataStore.users).to.deep.equal({});
              done();
            });
        });
    });
  });

});
