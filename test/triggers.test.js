/* eslint no-unused-expressions: "off" */

// const nock = require('nock');
const { expect } = require('chai');
const { getReceivers, getReceiversByGroupId } = require('../lib/utils/helpers');
const {
  getGroupsSuccessful,
  getReceiversSuccessful,
  getReceiversByGroupIdSuccessful,
  getReceiversByGroupIdEmpty,
} = require('./seed/triggers.seed');

describe('Triggers - getReceivers & getReceiversByGroupId', () => {
  const cfg = {
    accessToken: 'TOKEN',
  };

  before(async () => {
    getGroupsSuccessful;
    getReceiversSuccessful;
    getReceiversByGroupIdSuccessful;
    getReceiversByGroupIdEmpty;
  });

  it('should get all Receivers', async () => {
    const snapshot = {
      lastUpdated: (new Date(0)).getTime(),
    };
    const receivers = await getReceivers(cfg, snapshot);

    expect(receivers).to.not.be.empty;
    expect(receivers).to.be.an('array');
    expect(receivers).to.have.length(1);
    expect(receivers[0].email).to.equal('a@b.de');
    expect(receivers[0].attributes).to.exist;
    expect(receivers[0].attributes).to.be.a('object');
    expect(receivers[0].attributes.firstname).to.equal('Stefan');
    expect(receivers[0].global_attributes).to.exist;
    expect(receivers[0].global_attributes).to.be.a('object');
    expect(receivers[0].global_attributes.name).to.equal('Meyer');
  });

  it('should get all Receivers of provided group', async () => {
    const snapshot = {
      lastUpdated: 0,
    };

    cfg.group_id = 1;
    const receivers = await getReceiversByGroupId({}, cfg, snapshot);

    expect(receivers).to.not.be.empty;
    expect(receivers).to.be.an('array');
    expect(receivers).to.have.length(1);
    expect(receivers[0].email).to.equal('a@b.de');
    expect(receivers[0].attributes).to.exist;
    expect(receivers[0].attributes).to.be.a('object');
    expect(receivers[0].attributes.firstname).to.equal('Stefan');
    expect(receivers[0].global_attributes).to.exist;
    expect(receivers[0].global_attributes).to.be.a('object');
    expect(receivers[0].global_attributes.name).to.equal('Meyer');
  });

  it('should return an empty array if no Receivers were found in group', async () => {
    const snapshot = {
      lastUpdated: 0,
    };

    cfg.groupId = 0;
    const receivers = await getReceiversByGroupId(cfg, snapshot);
    expect(receivers).to.be.an('array');
    expect(receivers).to.have.lengthOf(0);
  });
});
