const async = require('async');
const request = require('request');
const util = require('../app/utility');

function run(args, gen, done) {
   "use strict";

   var teamProject = {};
   var azureEndpoint = {};
   var azureSub = {
      name: args.azureSub
   };
   var token = util.encodePat(args.pat);

   async.series([
      function (mainSeries) {
         util.findProject(args.tfs, args.project, token, gen, function (err, tp) {
            teamProject = tp;
            mainSeries(err, tp);
         });
      },
      function (mainSeries) {
         util.findAzureServiceEndpoint(args.tfs, teamProject.id, azureSub, token, gen, function (err, ep) {
            azureEndpoint = ep;
            mainSeries(err, azureEndpoint);
         });
      },
      function (mainSeries) {
         findOrCreateVariableGroup(args.tfs, teamProject, azureEndpoint, args.variableGroupName, token, gen, function (err, vg) {
            mainSeries(err, vg);
         })
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
   });
}

function findOrCreateVariableGroup(account, teamProject, azureEndpoint, variableGroupName, token, gen, callback) {
   'use strict';

   util.tryFindVariableGroup(account, teamProject, token, variableGroupName, function (e, vg) {
      if (e) {
         callback(e);
      }

      if (!vg) {
         createVariableGroup(account, teamProject, azureEndpoint, token, gen, callback);
      } else {
         gen.log.ok(`Found variable group ${variableGroupName}.`);
         callback(e, vg);
      }

   });
}

function createVariableGroup(account, teamProject, azureEndpoint, token, gen, callback) {
   "use strict";

   var options = util.addUserAgent({
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Basic ${token}` },
      json: true,
      url: `${util.getFullURL(account)}/${teamProject.name}/_apis/distributedtask/variablegroups`,
      qs: { 'api-version': `5.1-preview.1` },
      body: {
         "variables": {
            "app-rg-dev": {},
            "app-rg-prod": {},
            "app-rg-uat": {},
            "FrontendInsightsKey-dev": {},
            "FrontendInsightsKey-prod": {},
            "FrontendInsightsKey-uat": {},
            "InventoryContextSQL-dev": {},
            "InventoryContextSQL-prod": {},
            "InventoryContextSQL-uat": {},
            "InventoryInsightsKey-dev": {},
            "InventoryInsightsKey-prod": {},
            "InventoryInsightsKey-uat": {},
            "MongoConnectionString-dev": {},
            "MongoConnectionString-prod": {},
            "MongoConnectionString-uat": {},
            "ProductInsightsKey-dev": {},
            "ProductInsightsKey-prod": {},
            "ProductInsightsKey-uat": {}
         },
         "type": "AzureKeyVault",
         "providerData": {
            "serviceEndpointId": `${azureEndpoint.id}`,
            "vault": `SRE10-${teamProject.name}`
         },
         "name": "KeyVault",
         "description": "Variables From KeyVault"
      }
   });
   request(options, function (err, res, body) {
      callback(err, body);
   });

   gen.log.ok(`Created the KeyVault variable group.`);
}

module.exports = {
   run: run,
   findOrCreateVariableGroup: findOrCreateVariableGroup,
   createVariableGroup: createVariableGroup

}