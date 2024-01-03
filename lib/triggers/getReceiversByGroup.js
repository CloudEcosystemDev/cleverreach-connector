/* eslint no-param-reassign: "off" */
/* eslint consistent-return: "off" */

/**
 * Copyright 2021 Wice GmbH

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

const {
  getReceiversByGroupId, dataAndSnapshot, getMetadata, getElementDataFromResponse,
} = require('../utils/helpers');


/**
 * This method will be called from OIH platform providing following data
 *
 * @param msg - incoming message object that contains ``body`` with payload
 * @param cfg - configuration that is account information and configuration field values
 * @param snapshot - saves the current state of integration step for the future reference
 */
async function processTrigger(msg, cfg, snapshot = {}, incomingMessageHeaders, tokenData) {
  let { logger } = this;
  const {
    snapshotKey, arraySplittingKey, syncParam, skipSnapshot, logLevel,
  } = cfg.nodeSettings;

  if (['fatal', 'error', 'warn', 'info', 'debug', 'trace'].includes(logLevel)) {
    logger = this.logger.child({});
    if (logger.level) logger.level(logLevel);
  }

  logger.debug('Incoming message: %j', msg);
  logger.trace('Incoming configuration: %j', cfg);
  logger.debug('Incoming message headers: %j', incomingMessageHeaders);
  logger.debug('Incoming token data: %j', tokenData);

  logger.info('Starting to execute trigger getReceiversByGroupId');

  logger.info('Incoming snapshot: %j', snapshot);

  logger.info(
    'Trigger settings - "snapshotKey": %s, "arraySplittingKey": %s, "syncParam": %s, "skipSnapshot": %s',
    snapshotKey,
    arraySplittingKey,
    syncParam,
    skipSnapshot,
  );


  // Set the snapshot if it is not provided
  snapshot.lastUpdated = snapshot.lastUpdated || (new Date(0)).getTime();

  const persons = await getReceiversByGroupId(cfg, snapshot);

  console.error(`Found ${persons.length} new records.`);

  const newElement = {};
  newElement.metadata = getMetadata(msg.metadata);
  newElement.data = getElementDataFromResponse.call(this, arraySplittingKey, persons);

  if (skipSnapshot) {
    logger.info('Option skipSnapshot enabled, just going to return found data, pagination is disabled');
    return newElement.data; // no pagination if skipping snapshot
  }

  await dataAndSnapshot.call(this, newElement, snapshot, snapshotKey, '', this);

  logger.info('Execution finished');
}

module.exports = {
  process: processTrigger,
};
