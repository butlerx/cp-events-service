const lab = require('lab').script();
const chai = require('chai');

exports.lab = lab;

const expect = chai.expect;
chai.use(require('sinon-chai'));
const sinon = require('sinon');
const _ = require('lodash');

const fn = require('./update-address.js');

lab.experiment('Event - Update address', { timeout: 5000 }, () => {
  let sandbox;
  let senecaStub;
  let updateAddress;

  lab.beforeEach((done) => {
    sandbox = sinon.sandbox.create();
    senecaStub = {
      act: sandbox.stub(),
      make: sandbox.stub(),
    };
    updateAddress = fn.bind(senecaStub);
    done();
  });

  lab.afterEach((done) => {
    sandbox.restore();
    done();
  });

  lab.test('should get next events and update addresses of those events', (done) => {
    // ARRANGE
    const dojoId = 1;
    const mockLocation = {
      address: 'aha',
      city: { placeName: 'place' },
      country: {
        alpha2: 'FR',
        countryName: 'France',
      },
      position: { lat: 1, lng: 1 },
    };
    const mockEvents = [{ id: 1, name: 'event1' }];
    const eventMock = _.assign({}, mockLocation, { id: mockEvents[0].id });
    // PREPARE
    senecaStub.act
      .withArgs(sinon.match({ role: 'cd-events', entity: 'next-events', cmd: 'list' }))
      .callsFake((args, cb) => {
        expect(args.query).to.be.eql({
          dojoId,
          useDojoAddress: true,
        });
        cb(null, mockEvents);
      });
    senecaStub.act
      .withArgs(sinon.match({ role: 'cd-events', entity: 'event', cmd: 'save' }))
      .callsFake((args, cb) => {
        expect(args.event).to.be.eql(eventMock);
        cb(null, eventMock);
      });
    // ACT
    updateAddress({ role: 'cd-events', dojoId: 1, location: mockLocation }, (err, ret) => {
      expect(err).to.be.eql(undefined);
      expect(ret).to.be.eql(undefined);
      done();
    });
  });

  lab.test('should not save if there is no events', (done) => {
    // ARRANGE
    const dojoId = 1;
    const mockLocation = {
      address: 'aha',
      city: { placeName: 'place' },
      country: {
        alpha2: 'FR',
        countryName: 'France',
      },
      position: { lat: 1, lng: 1 },
    };
    const mockEvents = [];
    // PREPARE
    senecaStub.act
      .withArgs(sinon.match({ role: 'cd-events', entity: 'next-events', cmd: 'list' }))
      .callsFake((args, cb) => {
        expect(args.query).to.be.eql({
          dojoId,
          useDojoAddress: true,
        });
        cb(null, mockEvents);
      });
    // ACT
    updateAddress({ role: 'cd-events', dojoId: 1, location: mockLocation }, (err, ret) => {
      expect(err).to.be.eql(undefined);
      expect(ret).to.be.eql(undefined);
      expect(senecaStub.act.withArgs(sinon.match({ role: 'cd-events', entity: 'event', cmd: 'save' }))).to.not.have.been.called;
      done();
    });
  });
});
