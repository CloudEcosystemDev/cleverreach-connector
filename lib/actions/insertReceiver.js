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
  insertReceiver, getMetadata,
} = require('../utils/helpers');

/**
 * This method will be called from OIH platform providing following data
 *
 * @param {Object} msg - incoming message object that contains ``body`` with payload
 * @param {Object} cfg - configuration that is account information and configuration field values
 */
async function processAction(msg, cfg, snapshot, incomingMessageHeaders, tokenData) {
  let { logger } = this;
  const { logLevel } = cfg.nodeSettings;

  if (['fatal', 'error', 'warn', 'info', 'debug', 'trace'].includes(logLevel)) {
    logger = this.logger.child({});
    if (logger.level) logger.level(logLevel);
  }

  logger.debug('Incoming message: %j', msg);
  logger.trace('Incoming configuration: %j', cfg);
  logger.debug('Incoming snapshot: %j', snapshot);
  logger.debug('Incoming message headers: %j', incomingMessageHeaders);
  logger.debug('Incoming token data: %j', tokenData);


  // Upsert the object
  const reply = await insertReceiver(msg, cfg, msg.data.categories);

  const newElement = {};
  newElement.metadata = getMetadata(msg.metadata);
  newElement.data = reply.body;
  this.emit('data', newElement);
  this.logger.info('Execution finished');
}

module.exports = {
  process: processAction,
};
