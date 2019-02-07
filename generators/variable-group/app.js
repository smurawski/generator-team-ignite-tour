const async = require('async');
const request = require('request');
const util = require(`generator-team/generators/app/utility`);

function run(gen, callback) {
    "use strict";

    var token = util.encodePat(gen.pat);
    
    var options = util.addUserAgent({
       method: 'POST',
       headers: { 'content-type': 'application/json', authorization: `Basic ${token}` },
       json: true,
       url: `${util.getFullURL(gen.tfs)}/${gen.applicationName}/_apis/distributedtask/variablegroups`,
       qs: { 'api-version': util.PROJECT_API_VERSION },
       body: {
         "variables": {
            "key1": {
               "value": "value1"
             }
         },
         "type": "Vsts",
         "name": "KeyVault",
         "description": "Variables From KeyVault"
       }
    });
    gen.log.write(options);
    request(options, function (err, res, body) {
       callback(err, body);
    });
    
    gen.log.ok(`Created the KeyVault variable group.`);
 }

module.exports = {
    run: run
}