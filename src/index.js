var Log = require('log');
var log = new Log('info');
var express = require('express');
var app = express();
// var request = require('request');
var fs = require('fs');
var service = require('./boxService.js');
var storage = require('./storage.js');

// query the asset
app.get(/^\/a\/{0,1}(.+)?/i, function (req, res) {
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
        if (data) {
            res.send(data);
        } else {
            res.status(404).send('Not Found');
        }
    });

    if ('' + parseInt(assetId, 10) === assetId) {
        service.getAssetInfo(assetId, r);
    } else {
        service.getAssetInfoByPath(assetId, r);
    }
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

    var r2;
    var p2 = new Promise(resolve => {
        r2 = data => {
            resolve(data);
        };
    });

    p.then(data => {
        if (data) {
            service.getAsset(data, r2);
        } else {
            res.status(404).send('Not Found');
        }
    });

    p2.then(data => {
        if (data) {
            res.writeHead(200, {'Content-Type': data.mime_type});
            var fileStream = fs.createReadStream('media/' + data.media_id);
            fileStream.pipe(res);
        } else {
            res.status(404).send('Not Found');
        }
    });

    if ('' + parseInt(assetId, 10) === assetId) {
        service.getAssetInfo(assetId, r);
    } else {
        service.getAssetInfoByPath(assetId, r);
    }
});

app.listen(3000, function () {
    service.init(storage);
    log.debug('Example app listening on port 3000!');
});
