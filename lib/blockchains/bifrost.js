'use strict'; 
 
/** 
 * @module lib/blockchains/bifrost 
 * @summary Whiteflag API Topl Bifrost blockchain implementation 
 * @description Module to use the Topl Bifrost blockchain for Whiteflag 
 * 
 */ 
 
 module.exports = { 
     init: initBifrost,
     sendMessage
}

// Bifrost external modules //
const Brambl = require('brambljs');

// Whiteflag common functions and classes //
const log = require('../common/logger');
const object = require('../common/objects');
const { hash, zeroise } = require('../common/crypto');
const { ProcessingError } = require('../common/errors');
const { timeoutPromise } = require('../common/processing');

// Whiteflag modules //
const wfState = require('../protocol/state');

// Whiteflag event emitters //
const wfRxEvent = require('../protocol/events').rxEvent;

// Module variables //
let _brambl;
let _blockchainName = "bifrost";
let _chainId = 0;
let _account = "6sYyiTguyQ455w2dGEaNbrwkAWAEYV1Zk6FtZMknWDKQ";
 
function initBifrost(bcConfig, callback) { 
         // Preserve the name of the blockchain 
         _blockchainName = bcConfig.name;

         _brambl = Brambl.Requests("http://34.70.110.121:9085/")

         timeoutPromise(_brambl.chainInfo(), 10000)
         .then(function bramblInfoResolve(info) {
             log.info(_blockchainName, `Connected to Topl network: ${JSON.stringify(info.result)}`);
             return callback(null, _blockchainName)
         }).catch(function bramblInfoError(err) {
             log.warn(_blockchainName, `Could not get connection to Top network: ${err.message}`);
         });
}

/**
 * Sends an encoded message on the Topl blockchain
 * @function sendMessage
 * @alias module:lib/blockchains/bifrost.sendMessage
 * @param {wfMessage} wfMessage the Whiteflag message to be sent on Topl
 * @param {blockchainSendMessageCb} callback function to be called after sending Whiteflag message
 */
function sendMessage(wfMessage, callback) {
    log.info(`encodedMessage: ${JSON.stringify(wfMessage.MetaHeader.encodedMessage)}`)
    createAsset(wfMessage.MetaHeader.encodedMessage,
        function createAssetCb(err, txHash, blockNumber) {
            if (err) return callback(err, _blockchainName);
            return callback(null, txHash, blockNumber)
        })
}

/**
 * Create a new Topl CreateAsset transaction
 * @private
 * @param {string} message the data to be sent
 * @param {function(Error, txHash, blockNumber)} callback function to be called upon completion
 * @typedef {string} txHash the hash of the transaction containing the message
 * @typedef {number} blockNumber the block that includes the transaction with the message (unused)
 */
function createAsset(encodedMessage, callback) {

    log.info(`createAssets with message: ${encodedMessage}`)

    const params = {
        issuer: _account,
        assetCode: "PeaceCredit",
        recipient: _account,
        amount: 1,
        fee: 0,
        data: encodedMessage

    };

    _brambl.createAssets(params)
    .then(function txResult(tx) {
        log.info(`Message has been logged successfully: ${JSON.stringify(tx.result)}`);
        log.info(`txHash: ${tx.result.txHash}`);
        return callback(null, tx.result.txHash, 0);
    })
    .catch(function txError(err) {
        log.warn(`Message did not get processed correctly: ${err.message}`)
    })
}