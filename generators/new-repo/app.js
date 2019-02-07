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
       url: `${util.getFullURL(gen.tfs)}/${gen.applicationName}/_apis/git/repositories`,
       qs: { 'api-version': util.PROJECT_API_VERSION },
       body: {
          name: gen.repoName
       }
    });
 
    request(options, function (err, res, body) {
       callback(err, body);
    });
    
    gen.log.ok(`Created the ${gen.repoName} git repository.`);
 }

module.exports = {
    run: run
}