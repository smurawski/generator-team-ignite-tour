const util = require(`generator-team/generators/app/utility`);
const fs = require('fs');
const os = require('os');
const url = require('url');
const cheerio = require('cheerio');
const request = require(`request`);

function tryFindBuild(account, teamProject, token, type, target, callback) {
    'use strict';
 
    findBuild(account, teamProject, token, type, target, function (e, bld) {
       if (e && e.code === `NotFound`) {
          callback(null, undefined);
       } else {
          callback(e, bld);
       }
    });
 }
 
 function findBuild(account, teamProject, token, type, target, callback) {
    'use strict';
 
    var name = `${type}-CI`;
    var options = util.addUserAgent({
       "method": `GET`,
       "headers": {
          "cache-control": `no-cache`,
          "authorization": `Basic ${token}`
       },
       "url": `${util.getFullURL(account)}/${teamProject.id}/_apis/build/definitions`,
       "qs": {
          "api-version": util.BUILD_API_VERSION
       }
    });
 
    request(options, function (e, response, body) {
       var obj = JSON.parse(body);
       
       var bld = obj.value.find(function (i) {
          return i.name.toLowerCase() === name.toLowerCase();
       });
 
       if (!bld) {
          callback({
             "message": `Build ${name} not found`,
             "code": `NotFound`
          }, undefined);
       } else {
          callback(e, bld);
       }
    });
 }

 function tryFindRelease(args, callback) {
   'use strict';

   findRelease(args, function (e, rel) {
      if (e && e.code === `NotFound`) {
         callback(null, undefined);
      } else {
         callback(e, rel);
      }
   });
}

function findRelease(args, callback) {
   "use strict";

   var name = `${args.type} Release`

   var options = util.addUserAgent({
      "method": `GET`,
      "headers": {
         "cache-control": `no-cache`,
         "authorization": `Basic ${args.token}`
      },
      "url": `${util.getFullURL(args.account, true, util.RELEASE_MANAGEMENT_SUB_DOMAIN)}/${args.teamProject.name}/_apis/release/definitions`,
      "qs": {
         "api-version": util.RELEASE_API_VERSION
      }
   });

   request(options, function (e, response, body) {
      if (response.statusCode !== 200) {
         // The body is HTML
         var dom = cheerio.load(body);
         callback({
            "message": `Server Error: ${dom(`title`).text()}`,
            "code": `ServerError`
         }, undefined);

         return;
      }

      var obj = JSON.parse(body);

      var rel = obj.value.find(function (i) {
         return i.name.toLowerCase() === name.toLowerCase();
      });

      if (!rel) {
         callback({
            "message": `Release ${name} not found`,
            "code": `NotFound`
         }, undefined);
      } else {
         callback(e, rel);
      }
   });
}

 function tryFindRepo(account, teamProject, token, repoName, callback) {
    findRepo(account, teamProject, token, repoName, function (e, rp) {
       if (e && e.code === `NotFound`) {
          callback(null, undefined);
       } else {
          callback(e, rp);
       }
    });
 }

 function findRepo(account, teamProject, token, repoName, callback) {
   'use strict';
 
   var options = util.addUserAgent({
      "method": `GET`,
      "headers": {
         "cache-control": `no-cache`,
         "authorization": `Basic ${token}`
      },
      "url": `${util.getFullURL(account)}/${teamProject.id}/_apis/git/repositories`,
      "qs": {
         "api-version": util.PROJECT_API_VERSION
      }
   });

   request(options, function (e, response, body) {
      var obj = JSON.parse(body);
      
      var rp = obj.value.find(function (i) {
         return i.name.toLowerCase() === repoName.toLowerCase();
      });

      if (!rp) {
         callback({
            "message": `Repository ${repoName} not found`,
            "code": `NotFound`
         }, undefined);
      } else {
         callback(e, rp);
      }
   });
 }

 function tryFindVariableGroup(account, teamProject, token, variableGroupName, callback) {
   findVariableGroup(account, teamProject, token, variableGroupName, function (e, vg) {
      if (e && e.code === `NotFound`) {
         callback(null, undefined);
      } else {
         callback(e, vg);
      }
   });
 }

 function findVariableGroup(account, teamProject, token, variableGroupName, callback){
   'use strict';
 
   var options = util.addUserAgent({
      "method": `GET`,
      "headers": {
         "cache-control": `no-cache`,
         "authorization": `Basic ${token}`
      },
      "url": `${util.getFullURL(account)}/${teamProject.id}/_apis/distributedtask/variablegroups`,
      qs: { 'api-version': `5.1-preview.1` }
   });

   request(options, function (e, response, body) {
      var obj = JSON.parse(body);
      
      var vg = obj.value.find(function (i) {
         return i.name.toLowerCase() === variableGroupName.toLowerCase();
      });

      if (!vg) {
         callback({
            "message": `Variable group ${variableGroupName} not found`,
            "code": `NotFound`
         }, undefined);
      } else {
         callback(e, vg);
      }
   });
 }

module.exports = {

    // Exports the portions of the file we want to share with files that require
    // it.
    PROFILE_PATH: util.PROFILE_PATH,
    BUILD_API_VERSION: util.BUILD_API_VERSION,
    PROJECT_API_VERSION: util.PROJECT_API_VERSION,
    RELEASE_API_VERSION: util.RELEASE_API_VERSION,
    EXTENSIONS_SUB_DOMAIN: util.EXTENSIONS_SUB_DOMAIN,
    VSTS_BUILD_API_VERSION: util.VSTS_BUILD_API_VERSION,
    PACKAGE_FEEDS_API_VERSION: util.PACKAGE_FEEDS_API_VERSION,
    DISTRIBUTED_TASK_API_VERSION: util.DISTRIBUTED_TASK_API_VERSION,
    SERVICE_ENDPOINTS_API_VERSION: util.SERVICE_ENDPOINTS_API_VERSION,
    RELEASE_MANAGEMENT_SUB_DOMAIN: util.RELEASE_MANAGEMENT_SUB_DOMAIN,
 
 
    isVSTS: util.isVSTS,
    isPaaS: util.isPaaS,
    getPools: util.getPools,
    tokenize: util.tokenize,
    isDocker: util.isDocker,
    encodePat: util.encodePat,
    findQueue: util.findQueue,
    findBuild: findBuild,
    getFullURL: util.getFullURL,
    logMessage: util.logMessage,
    getTargets: util.getTargets,
    getAppTypes: util.getAppTypes,
    needsApiKey: util.needsApiKey,
    checkStatus: util.checkStatus,
    findProject: util.findProject,
    findRelease: findRelease,
    validateTFS: util.validateTFS,
    isDockerHub: util.isDockerHub,
    getAzureSubs: util.getAzureSubs,
    findAzureSub: util.findAzureSub,
    loadProfiles: util.loadProfiles,
    getPATPrompt: util.getPATPrompt,
    tryFindBuild: tryFindBuild,
    addUserAgent: util.addUserAgent,
    isKubernetes: util.isKubernetes,
    getUserAgent: util.getUserAgent,
    needsRegistry: util.needsRegistry,
    findAllQueues: util.findAllQueues,
    getTFSVersion: util.getTFSVersion,
    tryFindRelease: tryFindRelease,
    reconcileValue: util.reconcileValue,
    searchProfiles: util.searchProfiles,
    tryFindProject: util.tryFindProject,
    isWindowsAgent: util.isWindowsAgent,
    validateApiKey: util.validateApiKey,
    validateGroupID: util.validateGroupID,
    extractInstance: util.extractInstance,
    findPackageFeed: util.findPackageFeed,
    needsDockerHost: util.needsDockerHost,
    validateAzureSub: util.validateAzureSub,
    getInstancePrompt: util.getInstancePrompt,
    getImageNamespace: util.getImageNamespace,
    supportsLoadTests: util.supportsLoadTests,
    getProfileCommands: util.getProfileCommands,
    readPatFromProfile: util.readPatFromProfile,
    validateDockerHost: util.validateDockerHost,
    validateAzureSubID: util.validateAzureSubID,
    tryFindPackageFeed: util.tryFindPackageFeed,
    validatePortMapping: util.validatePortMapping,
    validateProfileName: util.validateProfileName,
    validateClusterName: util.validateClusterName,
    validateDockerHubID: util.validateDockerHubID,
    isExtensionInstalled: util.isExtensionInstalled,
    validateFunctionName: util.validateFunctionName,
    isTFSGreaterThan2017: util.isTFSGreaterThan2017,
    validateCustomFolder: util.validateCustomFolder,
    getDefaultPortMapping: util.getDefaultPortMapping,
    validateAzureTenantID: util.validateAzureTenantID,
    validateDockerRegistry: util.validateDockerRegistry,
    getDockerRegistryServer: util.getDockerRegistryServer,
    validateApplicationName: util.validateApplicationName,
    findNuGetServiceEndpoint: util.findNuGetServiceEndpoint,
    findAzureServiceEndpoint: util.findAzureServiceEndpoint,
    findDockerServiceEndpoint: util.findDockerServiceEndpoint,
    validateDockerHubPassword: util.validateDockerHubPassword,
    validateServicePrincipalID: util.validateServicePrincipalID,
    validateServicePrincipalKey: util.validateServicePrincipalKey,
    tryFindAzureServiceEndpoint: util.tryFindAzureServiceEndpoint,
    validatePersonalAccessToken: util.validatePersonalAccessToken,
    tryFindNuGetServiceEndpoint: util.tryFindNuGetServiceEndpoint,
    tryFindDockerServiceEndpoint: util.tryFindDockerServiceEndpoint,
    validateClusterResourceGroup: util.validateClusterResourceGroup,
    validateDockerCertificatePath: util.validateDockerCertificatePath,
    findDockerRegistryServiceEndpoint: util.findDockerRegistryServiceEndpoint,
    tryFindDockerRegistryServiceEndpoint: util.tryFindDockerRegistryServiceEndpoint,
    tryFindRepo: tryFindRepo,
    findRepo: findRepo,
    tryFindVariableGroup: tryFindVariableGroup,
    findVariableGroup: findVariableGroup
 };