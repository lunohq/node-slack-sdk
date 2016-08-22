var expect = require('chai').expect;
var Promise = require('bluebird');

var RTM_FIXTURE = require('../fixtures/rtm.start');
var getMemoryDataStore = require('../utils/client').getMemoryDataStore;
var userModel = require('../../lib/models/user');

describe('Models', function () {
  var dataStore;

  beforeEach(function () {
    return getMemoryDataStore()
      .then(function (store) {
        dataStore = store;
      });
  });
  describe('Model', function () {
    var testToJSON = function testToJSON(memoryStore, propertyType) {
      var rawObj;
      var promise;

      if (propertyType === 'users') {
        rawObj = RTM_FIXTURE.users[1];
        promise = memoryStore.getUserById(rawObj.id);
      } else {
        rawObj = RTM_FIXTURE[propertyType][0];
        promise = memoryStore.getChannelGroupOrDMById(rawObj.id);
      }
      return promise.then(function (modelObj) {
        expect(JSON.stringify(modelObj)).to.deep.equal(JSON.stringify(rawObj));
      });
    };

    describe('#toJSON()', function () {
      it('converts model objects to a JSON serializable representation', function () {
        var promises = [
          testToJSON(dataStore, 'ims'),
          testToJSON(dataStore, 'channels'),
          testToJSON(dataStore, 'groups'),
          testToJSON(dataStore, 'users')
        ];
        return Promise.all(promises);
      });
    });

    describe('#update()', function () {
      it('updates model objects with objects as new properties', function () {
        var rawObj = RTM_FIXTURE.users[0];

        return dataStore.getUserById(rawObj.id)
          .then(function (modelObj) {
            modelObj.update({
              buddy: RTM_FIXTURE.users[1]
            });

            expect(modelObj.buddy).to.be.an.instanceof(userModel);
          });
      });
    });

  });
});
