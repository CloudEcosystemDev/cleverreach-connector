/* eslint-disable no-param-reassign */
/* eslint-disable no-plusplus */
/* eslint-disable radix */
/* eslint no-await-in-loop: "off" */
/* eslint consistent-return: "off" */

const request = require('request-promise').defaults({ simple: false, resolveWithFullResponse: true });
const lodashGet = require('lodash.get');
const dayjs = require('dayjs');

const secretServiceApiEndpoint = process.env.SECRET_SERVICE_ENDPOINT || 'https://secret-service.openintegrationhub.com';

const apiUrl = 'https://rest.cleverreach.com/v3';

async function getGroups(cfg) {
  const url = (cfg.apiUrl) ? cfg.apiUrl : apiUrl;

  const groupOptions = {
    method: 'GET',
    uri: `${url}/groups.json`,
    json: true,
    qs: {
    },
    headers: {
      Authorization: `Bearer ${cfg.accessToken}`,
    },
  };

  const groupResponse = await request(groupOptions);

  let groups = [];
  if (groupResponse.statusCode === 200) {
    if (cfg.devMode) {
      console.log(JSON.stringify(groupResponse.body));
    }
    if (Array.isArray(groupResponse.body)) groups = groupResponse.body;
  } else {
    console.error(groupResponse.statusCode);
    console.error(groupResponse.text);
    console.log(JSON.stringify(groupResponse.body));
  }
  return groups;
}

async function insertReceiver(msg, cfg, categories) { // , recordUid
  try {
    const newMsg = {
      data: Object.assign({}, msg.data),
      metadata: Object.assign({}, msg.metadata),
    };
    // if (id) newMsg.data.id = id;

    const url = (cfg.apiUrl) ? cfg.apiUrl : apiUrl;

    let groupId;
    if (cfg.groupId) {
      // eslint-disable-next-line prefer-destructuring
      groupId = cfg.groupId;
    } else if (categories && categories.length > 0) {
      // No groupId provided trying to match category to group
      const categoriesLength = categories.length;
      const categoriesHash = {};
      for (let i = 0; i < categoriesLength; i += 1) {
        categoriesHash[categories[i].label.toLowerCase()] = 1;
      }
      const groups = await getGroups(cfg);

      const { length } = groups;
      for (let i = 0; i < length; i += 1) {
        if (groups[i].name.toLowerCase() in categoriesHash) {
          groupId = groups[i].id;
          break;
        }
      }
    }

    const options = {
      method: 'POST',
      uri: `${url}/groups.json/${groupId}/receivers`,
      json: true,
      headers: {
        Authorization: `Bearer ${cfg.accessToken}`,
      },
      body: newMsg.data,
    };

    const response = await request(options);

    // Upon success, return the new ID
    if (response.statusCode === 200 || response.statusCode === 201) {
      return response.body;
    }
    return false;
  } catch (e) {
    console.error(e);
    return {};
  }
}


async function getReceivers(cfg, snapshot) {
  try {
    const url = (cfg.apiUrl) ? cfg.apiUrl : apiUrl;

    // First get all groups
    const groups = await getGroups(cfg);

    // Then get all entries for each group
    let entries = [];
    const { length } = groups;
    for (let i = 0; i < length; i += 1) {
      let page = 0;
      let nextPage = true;
      while (nextPage) {
        const options = {
          method: 'GET',
          uri: `${url}/groups.json/${groups[i].id}/receivers`,
          json: true,
          qs: {
            page,
            pagesize: 5000,
            type: 'all',
            detail: 2,
            order_by: 'registered DESC',
          },
          headers: {
            Authorization: `Bearer ${cfg.accessToken}`,
          },
        };
        page += 1;
        const response = await request(options);
        if (response.statusCode === 200) {
          if (cfg.devMode) {
            console.log(JSON.stringify(response.body));
          }

          if (Array.isArray(response.body)) {
            const entriesLength = response.body.length;
            if (entriesLength < 5000) nextPage = false;
            for (let j = 0; j < entriesLength; j += 1) {
              const entry = response.body[j];

              if (
                entry.registered <= snapshot.lastUpdated
                || entry.activated <= snapshot.lastUpdated
              ) {
                nextPage = false;
                break;
              }

              entry.category = groups[i].name;
              entries.push(entry);
            }
          } else {
            nextPage = false;
          }
        } else {
          nextPage = false;
          console.error(response.statusCode);
          console.error(response.text);
          console.log(JSON.stringify(response.body));
        }
      }
    }

    // @todo: Consider duplicates?
    if (snapshot) entries = entries.filter(entry => (entry.last_changed ? entry.last_changed : Date.now()) > snapshot.lastUpdated);

    return entries;
  } catch (e) {
    console.error(e);
    return [];
  }
}

async function getReceiversByGroupId(cfg, snapshot) {
  try {
    // First get all groups because we also need the group name
    const groups = await getGroups(cfg);
    const groupsLength = groups.length;

    let groupName = 'NoGroupName';

    let { groupId } = cfg;

    if (cfg.groupId) {
      for (let i = 0; i < groupsLength; i += 1) {
        if (groups[i].id === cfg.groupId) {
          groupName = groups[i].name;
          break;
        }
      }
    } else if (cfg.groupName) {
      const nameKey = cfg.groupName.toLowerCase();
      // eslint-disable-next-line prefer-destructuring
      groupName = cfg.groupName;
      for (let i = 0; i < groupsLength; i += 1) {
        if (groups[i].name.toLowerCase() === nameKey) {
          groupId = groups[i].id;
          break;
        }
      }
    }

    // Fetch entries in group
    const url = (cfg.apiUrl) ? cfg.apiUrl : apiUrl;

    let entries = [];

    let page = 0;
    let nextPage = true;

    while (nextPage) {
      const options = {
        method: 'GET',
        uri: `${url}/groups.json/${groupId}/receivers`,
        json: true,
        qs: {
          page,
          pagesize: 5000,
          type: 'all',
          detail: 2,
          order_by: 'registered DESC',
        },
        headers: {
          Authorization: `Bearer ${cfg.accessToken}`,
        },
      };
      page += 1;

      const response = await request(options);

      if (response.statusCode === 200) {
        if (cfg.devMode) {
          console.log(JSON.stringify(response.body));
        }

        if (Array.isArray(response.body)) {
          const { length } = response.body;
          if (length < 5000) nextPage = false;
          for (let i = 0; i < length; i += 1) {
            const entry = response.body[i];

            if (
              entry.registered <= snapshot.lastUpdated
              || entry.activated <= snapshot.lastUpdated
            ) {
              nextPage = false;
              break;
            }

            entry.category = groupName;
            entries.push(entry);
          }
        } else {
          nextPage = false;
        }
      } else {
        nextPage = false;
        console.error(response.statusCode);
        console.error(response.text);
        console.log(JSON.stringify(response.body));
      }
    }
    if (snapshot) entries = entries.filter(entry => (entry.last_changed ? entry.last_changed : Date.now()) > snapshot.lastUpdated);
    return entries;
  } catch (e) {
    console.error(e);
    return [];
  }
}

function compareDate(a, b) {
  return dayjs(a).isAfter(b);
}

function isMicrosoftJsonDate(dateStr) {
  const regex = /^\/Date\((\d+)([+-]\d{4})?\)\/$/;
  if (regex.test(dateStr)) {
    const match = dateStr.match(regex);
    const milliseconds = parseInt(match[1]);
    const timeZoneOffset = match[2] ? parseInt(match[2]) / 100 : 0;
    return new Date(milliseconds + timeZoneOffset * 60 * 60 * 1000);
  }
  return null;
}

async function getAccessToken(config) {
  try {
    if (config.accessToken) {
      return config.accessToken;
    }

    const response = await request({
      method: 'GET',
      uri: `${secretServiceApiEndpoint}/secrets/${config.secret}`,
      headers: {
        'x-auth-type': 'basic',
        authorization: `Bearer ${config.iamToken}`,
      },
      json: true,
    });

    const { value } = response.body;
    return value.accessToken;
  } catch (e) {
    console.log(e);
    return e;
  }
}

async function dataAndSnapshot(newElement, snapshot, snapshotKey, standardSnapshot, self) {
  if (Array.isArray(newElement.data)) {
    this.logger.info('Found %s items in response data', newElement.data.length);
    let lastObjectDate = 0;
    let emittedItemsCount = 0;
    for (let i = 0; i < newElement.data.length; i++) {
      const newObject = { ...newElement, data: newElement.data[i] };
      let currentObjectDate = lodashGet(newObject.data, snapshotKey)
        ? lodashGet(newObject.data, snapshotKey)
        : lodashGet(newObject.data, standardSnapshot);
      if (currentObjectDate) {
        const parsedDate = isMicrosoftJsonDate(currentObjectDate);
        if (parsedDate) {
          this.logger.info('Microsoft JSON date format detected, parsed date: %s', parsedDate);
          currentObjectDate = parsedDate;
        }
      }
      if (!snapshot.lastUpdated) {
        if (compareDate(currentObjectDate, lastObjectDate)) {
          lastObjectDate = currentObjectDate;
        }
        await self.emit('data', newObject);
        emittedItemsCount++;
      } else if (compareDate(currentObjectDate, snapshot.lastUpdated)) {
        if (compareDate(currentObjectDate, lastObjectDate)) {
          lastObjectDate = currentObjectDate;
        }
        await self.emit('data', newObject);
        emittedItemsCount++;
      }
    }
    this.logger.info('%s items were emitted', emittedItemsCount);
    snapshot.lastUpdated = lastObjectDate !== 0 ? lastObjectDate : snapshot.lastUpdated;
    await self.emit('snapshot', snapshot);
    this.logger.info('A new snapshot was emitted: %j', snapshot);
  } else {
    this.logger.info('Found one item in response data, going to emit...');
    await self.emit('data', newElement);
  }
}

function getMetadata(metadata) {
  const metadataKeys = ['oihUid', 'recordUid', 'applicationUid'];
  const newMetadata = {};
  for (let i = 0; i < metadataKeys.length; i++) {
    newMetadata[metadataKeys[i]] = metadata !== undefined && metadata[metadataKeys[i]] !== undefined
      ? metadata[metadataKeys[i]]
      : `${metadataKeys[i]} not set yet`;
  }
  return newMetadata;
}

function getElementDataFromResponse(splittingKey, res) {
  if (!splittingKey) {
    this.logger.info('Splitting key missing, going to return original data...');
    return res;
  }
  this.logger.info('Going to split result by key: %s', splittingKey);
  return splittingKey.split('.').reduce((p, c) => (p && p[c]) || null, res);
}


module.exports = {
  insertReceiver, getReceivers, getReceiversByGroupId, getAccessToken, dataAndSnapshot, getMetadata, getElementDataFromResponse,
};
