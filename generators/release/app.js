// This is the code that deals with TFS
const fs = require('fs');
const async = require('async');
const uuidV4 = require('uuid/v4');
const request = require('request');
const util = require('../app/utility');
const path = require(`path`);

function run(args, gen, done) {
   'use strict';

   var build = {};
   var approverId;
   var queueId = 0;
   var azureSub = {
      name: args.azureSub
   };
   var teamProject = {};
   var azureEndpoint = {};
   var approverUniqueName;
   var approverDisplayName;
   var dockerEndpoint = {};
   var dockerRegistryEndpoint = {};
   var token = util.encodePat(args.pat);

   // PowerShell
   var moduleFeed;
   var powerShellGallery;

   async.series([
      function (mainSeries) {
         util.findProject(args.tfs, args.project, token, gen, function (err, tp) {
            teamProject = tp;
            mainSeries(err, tp);
         });
      },
      function (mainSeries) {
         async.parallel([
            function (inParallel) {
               util.findQueue(args.queue, args.tfs, teamProject, token, function (err, id) {
                  queueId = id;
                  inParallel(err, id);
               });
            },
            function (inParallel) {
               if (util.needsDockerHost({}, args)) {
                  util.findDockerServiceEndpoint(args.tfs, teamProject.id, args.dockerHost, token, gen, function (err, ep) {
                     dockerEndpoint = ep;
                     inParallel(err, dockerEndpoint);
                  });
               } else {
                  inParallel(null, undefined);
               }
            },
            function (inParallel) {
               // Get the package management feed
               if (util.needsApiKey({}, args)) {
                  util.findPackageFeed(args.tfs, teamProject.name, token, gen, function (err, feed) {
                     moduleFeed = feed;
                     inParallel(err, moduleFeed);
                  });
               } else {
                  inParallel(null, undefined);
               }
            },
            function (inParallel) {
               // Get the PowerShell Gallery connection
               if (util.needsApiKey({}, args)) {
                  util.findNuGetServiceEndpoint(args.tfs, teamProject.id, token, gen, function (err, conn) {
                     powerShellGallery = conn;
                     inParallel(err, powerShellGallery);
                  });
               } else {
                  inParallel(null, undefined);
               }
            },
            function (inParallel) {
               if (util.needsRegistry({}, args)) {
                  util.findDockerRegistryServiceEndpoint(args.tfs, teamProject.id, args.dockerRegistry, token, function (err, ep) {
                     dockerRegistryEndpoint = ep;
                     inParallel(err, dockerRegistryEndpoint);
                  });
               } else {
                  inParallel(null, undefined);
               }
            },
            function (inParallel) {
               util.findBuild(args.tfs, teamProject, token, args.type, args.target, function (err, bld) {
                  build = bld;
                  approverId = bld.authoredBy.id;
                  approverUniqueName = bld.authoredBy.uniqueName;
                  approverDisplayName = bld.authoredBy.displayName;
                  inParallel(err, bld);
               });
            },
            function (inParallel) {
               if (util.isPaaS(args)) {
                  util.findAzureServiceEndpoint(args.tfs, teamProject.id, azureSub, token, gen, function (err, ep) {
                     azureEndpoint = ep;
                     inParallel(err, azureEndpoint);
                  });
               } else {
                  azureEndpoint = undefined;
                  inParallel(null, undefined);
               }
            }
         ], mainSeries);
      },
      function (mainSeries) {
         var relArgs = {
            token: token,
            build: build,
            type: args.type,
            queueId: queueId,
            account: args.tfs,
            target: args.target,
            appName: args.appName,
            moduleFeed: moduleFeed,
            approverId: approverId,
            teamProject: teamProject,
            template: args.releaseJson,
            clusterName: args.clusterName,
            dockerPorts: args.dockerPorts,
            dockerHostEndpoint: dockerEndpoint,
            dockerRegistry: args.dockerRegistry,
            powerShellGallery: powerShellGallery,
            approverUniqueName: approverUniqueName,
            dockerRegistryId: args.dockerRegistryId,
            approverDisplayName: approverDisplayName,
            dockerRegistryEndpoint: dockerRegistryEndpoint,
            clusterResourceGroup: args.clusterResourceGroup,
            endpoint: azureEndpoint ? azureEndpoint.id : null,
            dockerRegistryPassword: args.dockerRegistryPassword
         };

         findOrCreateRelease(relArgs, gen, function (err, rel) {
            mainSeries(err, rel);
         });
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

function getRelease(args, callback) {
    callback(null, `${args.type}_release.json`);
}

function findOrCreateRelease(args, gen, callback) {
   'use strict';

   util.tryFindRelease(args, function (e, rel) {
      if (e) {
         callback(e);
      }

      if (!rel) {
         createRelease(args, gen, callback);
      } else {
         gen.log.ok(`Found release definition`);
         callback(e, rel);
      }
   });
}

function createRelease(args, gen, callback) {
   'use strict';

   let releaseDefName = `${args.type}`;

   gen.log.ok(`Creating ${releaseDefName} release definition`);

   // Qualify the image name with the dockerRegistryId for docker hub
   // or the server name for other registries.
   let endPoint = args.dockerRegistryEndpoint;
   let url = (endPoint && endPoint.authorization) ? endPoint.authorization.parameters.registry : undefined;
   let dockerNamespace = util.getImageNamespace(args.dockerRegistryId, url);

   // Azure website names have to be unique.  So we gen a GUID and addUserAgent
   // a portion to the site name to help with that.
   let uuid = uuidV4();

   // Load the template and replace values.
   var tokens = {
      '{{BuildId}}': args.build.id,
      '"{{QueueId}}"': args.queueId,
      '{{WebAppName}}': args.appName,
      '{{uuid}}': uuid.substring(0, 8),
      '{{BuildName}}': args.build.name,
      '{{ApproverId}}': args.approverId,
      '{{ProjectId}}': args.teamProject.id,
      '{{ConnectedServiceID}}': args.endpoint,
      '{{ProjectName}}': args.teamProject.name,
      '{{PackageManagementFeedID}}': args.moduleFeed ? args.moduleFeed.id : null,
      '{{PowerShellGallery}}': args.powerShellGallery ? args.powerShellGallery.id : null,
      '{{ApproverDisplayName}}': args.approverDisplayName,
      '{{ProjectLowerCase}}': args.teamProject.name.toLowerCase(),
      '{{dockerPorts}}': args.dockerPorts ? args.dockerPorts : null,
      '{{ApproverUniqueName}}': args.approverUniqueName.replace("\\", "\\\\"),
      '{{dockerHostEndpoint}}': args.dockerHostEndpoint ? args.dockerHostEndpoint.id : null,
      '{{TemplateFolder}}': args.type === 'aspFull' ? `${args.appName}.IaC` : `templates`,
      '{{dockerRegistryId}}': dockerNamespace,
      '{{containerregistry}}': args.dockerRegistry,
      '{{containerregistry_noprotocol}}': args.dockerRegistry ? util.getDockerRegistryServer(args.dockerRegistry) : null,
      '{{containerregistry_username}}': args.dockerRegistryId,
      '{{containerregistry_password}}': args.dockerRegistryPassword,
      '{{dockerRegistryEndpoint}}': args.dockerRegistryEndpoint ? args.dockerRegistryEndpoint.id : null,
      '{{ReleaseDefName}}': releaseDefName,
      '{{ClusterName}}': args.clusterName,
      '{{ClusterResourceGroup}}': args.clusterResourceGroup
   };

   var contents = fs.readFileSync(args.template, 'utf8');

   // fs.writeFileSync(path.join(`${args.type}.json`),util.tokenize(contents, tokens));

   var options = util.addUserAgent({
      method: 'POST',
      headers: {
         'cache-control': 'no-cache',
         'content-type': 'application/json',
         'authorization': `Basic ${args.token}`
      },
      json: true,
      url: `${util.getFullURL(args.account, true, util.RELEASE_MANAGEMENT_SUB_DOMAIN)}/${args.teamProject.name}/_apis/release/definitions`,
      qs: {
         'api-version': util.RELEASE_API_VERSION
      },
      body: JSON.parse(util.tokenize(contents, tokens))
   });

   // I have witnessed the release returning a 403 if you try
   // to create it too quickly.  The release REST API appears
   // to return 403 for several reasons and could cause an
   // infinite loop on this code waiting on RM to become ready.
   var status = '';

   async.whilst(
      function () {
         return status !== 'failed' && status !== 'succeeded';
      },
      function (finished) {
         request(options, function (err, resp, body) {

            if (resp.statusCode >= 400) {
               status = "failed";
               finished(new Error(resp.body), null);
            } else if (resp.statusCode >= 300) {
               status = "in progress";
               finished(err, null);
            } else {
               status = "succeeded";
               finished(err, body);
            }
         });
      },
      function (err, results) {
         callback(err, results);
      }
   );
}

module.exports = {

   // Exports the portions of the file we want to share with files that require
   // it.

   run: run,
   getRelease: getRelease,
   findOrCreateRelease: findOrCreateRelease
};