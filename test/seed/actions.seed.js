const nock = require('nock');

const entryId = 1;
const url = 'https://rest.cleverreach.com/v3';
const groups = [{
  id: '1',
  name: 'Testgruppe',
}];

const getGroupsSuccessful = nock(`${url}/groups.json`)
  .get('')
  .reply(200, groups)
  .persist();

const createReceiverSuccessful = nock(`${url}/groups.json/${groups[0].id}/receivers`)
  .post('')
  .reply(200, { id: 'abc123' });

const createReceiverFailed = nock(`${url}/groups.json/0/receivers`)
  .post('')
  .reply(500, 'Group not found');


const deleteReceiverSuccessful = nock(`${url}/groups.json/${groups[0].id}/receivers/${entryId}`)
  .delete('')
  .reply(200, {});

const deleteReceiverFailed = nock(`${url}/groups.json/${groups[0].id}/receivers/7`)
  .delete('')
  .reply(500, 'Can not delete. Entry not found');


module.exports = {
  getGroupsSuccessful,
  createReceiverSuccessful,
  createReceiverFailed,
  deleteReceiverSuccessful,
  deleteReceiverFailed,
};
