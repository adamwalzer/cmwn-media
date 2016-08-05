var Log = require('log');
var log = new Log('info');
var rollbar = require('rollbar');
var express = require('express');
var app = express();
var request = require('request');
var service = require('./boxService.js');
var storage = require('./storage.js');
var rollbarKeys = require('./rollbar.json');
var AWS = require('aws-sdk');

AWS.config.loadFromPath('./src/aws.json');
var docClient = new AWS.DynamoDB.DocumentClient();

const CACHE_EXPIRY = 1; //hours

// query the asset
app.get(/^\/a\/{0,1}(.+)?/i, function (req, res) {
    'use strict';
    var assetId;
    var r;
    var p;

    var params = {
        TableName: 'media-cache',
        Key: {
            'path': req.url
        }
    };

    log.debug(req.url);
    log.debug(req.params);

    assetId = req.params[0] || '0';
    log.debug('Asset Id: ' + assetId);

    p = new Promise(resolve => {
        r = data => {
            resolve(data);
        };
    });

    p.then(data => {
        if (data) {
            res.send(data);
            if (!data.cached) {
                docClient.put({TableName: 'media-cache', Item: {
                    path: req.url,
                    expires: Math.floor((new Date).getTime() / 1000) + CACHE_EXPIRY * 360000,
                    data: data
                }}, function (err) {
                    if (err) {
                        console.error('cache store failed: ' + err);
                    }
                });
            }
        } else {
            res.status(data.status || 404).send('Not Found');
        }
    });

    docClient.get(params, function (err, data) {
        if (err || !Object.keys(data).length) {
            service.getAssetInfo(assetId, r);
        } else {
            if (data.Item.expires - Math.floor((new Date).getTime() / 1000) < 0 ) {
                service.getAssetInfo(assetId, r);
            } else {
                data.Item.data.cached = true;
                r(data.Item.data);
            }
        }
    });

});

// Serve the asset
app.get('/f/*', function (req, res) {
    'use strict';

    log.debug(req.url);
    log.debug(req.params);

    var assetId = req.params[0] || '0';
    log.debug('Asset Id: ' + assetId);

    var r;
    var p = new Promise(resolve => {
        r = data => {
            resolve(data);
        };
    });

    p.then(data => {
        if (data && data.url) {
            request(data.url).pipe(res);
        } else {
            res.status(data.status || 404).send('Not Found');
        }
    });

    service.getAsset(assetId, r);
});

rollbar.init({environment: 'Media'});
rollbar.handleUncaughtExceptions(rollbarKeys.token);
rollbar.handleUnhandledRejections(rollbarKeys.token);
app.use(rollbar.errorHandler(rollbarKeys.token));

app.listen(3000, function () {
    service.init(storage);
    log.debug('Example app listening on port 3000!');
});
