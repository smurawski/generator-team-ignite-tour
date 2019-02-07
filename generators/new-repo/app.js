const async = require('async');
const request = require('request');
const util = require('../app/utility');

function run(args, gen, done) {
   "use strict";

   var repo = {};
   var teamProject = {};
   var token = util.encodePat(args.pat);


   async.series([
         function (mainSeries) {
            util.findProject(args.tfs, args.project, token, gen, function (err, tp) {
               teamProject = tp;
               mainSeries(err, tp);
            }
            );
         },
         function (mainSeries) {
            findOrCreateRepo(args.tfs, teamProject, token, args.repoName, gen, mainSeries);
         }
      ], function (err, results) {
         // This is just for test and will be undefined during normal use
         if (done) {
            done(err);
         }

         if (err) {
            // To get the stacktrace run with the --debug built-in option when 
            // running the generator.
            gen.log.info(err.message);
            gen.env.error();
         }
      }
   );

}

function findOrCreateRepo(account, teamProject, token, repoName, gen, callback) {
   'use strict';
   util.tryFindRepo(account, teamProject, token, repoName, function (e, rp) {
      if (e) {
         callback(e);
      }
      if (!rp) {
         createRepo(account, teamProject, token, repoName, gen, callback);
      } else {
         gen.log.ok(`Found existing repository ${repoName}.`);
         callback(e, rp);
      }
   });

}

function createRepo(account, teamProject, token, repoName, gen, callback) {
   'use strict';

   gen.log.ok(`Creating the ${repoName} git repository.`);

   var options = util.addUserAgent({
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Basic ${token}` },
      json: true,
      url: `${util.getFullURL(account)}/${teamProject.id}/_apis/git/repositories`,
      qs: { 'api-version': util.PROJECT_API_VERSION },
      body: {
         name: repoName
      }
   });

   request(options, function (err, res, body) {
      if (res.statusCode >= 400) {
         // To get the stacktrace run with the --debug built-in option when 
         // running the generator.
         gen.log.info(response.body.message.replace('\n', ' '));
         gen.env.error();
      }
      callback(err, body);
   });

}
module.exports = {
   run: run,
   findOrCreateRepo: findOrCreateRepo
}