/* eslint no-unused-expressions: "off" */

const { expect } = require('chai');
const { insertReceiver } = require('../lib/utils/helpers');

const cfg = {
  accessToken: 'TOKEN',
};

const msg = {
  metadata: {},
  data: {},
};

const categories = [{ label: 'testgruppe' }];

const {
  getGroupsSuccessful,
  createReceiverSuccessful,
  // createReceiverFailed,
  updateReceiverSuccessful,
  // updateReceiverFailed,
  // deleteReceiverSuccessful,
  // deleteReceiverFailed,
} = require('./seed/actions.seed');

describe('Actions - insertReceiver', () => {
  before(async () => {
    getGroupsSuccessful;
    createReceiverSuccessful;
    // createReceiverFailed;
    updateReceiverSuccessful;
    // updateReceiverFailed;
    // deleteReceiverSuccessful;
    // deleteReceiverFailed;
  });

  it('should create a Receiver', async () => {
    const receiver = await insertReceiver(msg, cfg, categories);
    expect(receiver).to.not.be.empty;
    expect(receiver).to.be.a('object');
    expect(receiver.id).to.equal('abc123');
  });
});
