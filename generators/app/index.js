'use strict';

const yosay = require(`yosay`);
const Generator = require(`yeoman-generator`);
const argUtils = require(`generator-team/generators/app/args`);
const prompts = require(`generator-team/generators/app/prompt`);
const util = require('../app/utility');
const compose = require(`generator-team/generators/app/compose`);
const path = require(`path`);

module.exports = class extends Generator {
    constructor(args, opts) {
        // Calling the super constructor is important so our generator is correctly set up
        super(args, opts);

        // Order is important
        // These are position based arguments for this generator. If they are not provided
        // via the command line they will be queried during the prompting priority
        // applicationName is city in this context
        argUtils.applicationName(this);
        argUtils.tfs(this);
        argUtils.pat(this);
        argUtils.azureSub(this);
        argUtils.azureSubId(this);
        argUtils.tenantId(this);
        argUtils.servicePrincipalId(this);
        argUtils.servicePrincipalKey(this);
    }

    initializing() {
        this.log.write(yosay(`Welcome to the Ignite Tour SRE10 generator.`));
    }

    prompting() {
        // Collect any missing data from the user.
        // This gives me access to the generator in the
        // when callbacks of prompt
        let cmdLnInput = this;

        // When this generator is called alone as in team:azure
        // we have to make sure the prompts below realize they
        // need to get a subscription. If we don't setup everything
        // right now the user will not be asked for a subscription.
        cmdLnInput.options.target = `paas`;


        return this.prompt([
            prompts.tfs(this),
            prompts.pat(this),
            prompts.applicationName(this),
            prompts.azureSubInput(this),
            prompts.azureSubList(this),
            prompts.azureSubId(this),
            prompts.tenantId(this),
            prompts.creationMode(this),
            prompts.servicePrincipalId(this),
            prompts.servicePrincipalKey(this),
        ]).then(function (answers) {
            this.pat = util.reconcileValue(cmdLnInput.options.pat, answers.pat);
            this.tfs = util.reconcileValue(cmdLnInput.options.tfs, answers.tfs);
            this.azureSub = util.reconcileValue(cmdLnInput.options.azureSub, answers.azureSub, ``);
            this.tenantId = util.reconcileValue(cmdLnInput.options.tenantId, answers.tenantId, ``);
            this.azureSubId = util.reconcileValue(cmdLnInput.options.azureSubId, answers.azureSubId, ``);
            this.applicationName = util.reconcileValue(cmdLnInput.options.applicationName, answers.applicationName, ``);
            this.servicePrincipalId = util.reconcileValue(cmdLnInput.options.servicePrincipalId, answers.servicePrincipalId, ``);
            this.servicePrincipalKey = util.reconcileValue(cmdLnInput.options.servicePrincipalKey, answers.servicePrincipalKey, ``);
            this.target = util.reconcileValue(cmdLnInput.options.target, answers.target, ``);
        }.bind(this));
    }

    configuring() {
        // Based on the users answers compose all the required generators.
        // Create a project for the city
        compose.addProject(this);

        // Add the Azure service connection
        compose.addAzure(this);

        // Setup Repos
        this.composeWith(`team-ignite-tour:new-repo`, {
            arguments: [`web-app-infra`, this.applicationName, this.tfs, this.pat]
        });
        this.composeWith(`team-ignite-tour:new-repo`, {
            arguments: [`inventory-service`, this.applicationName, this.tfs, this.pat]
        });
        this.composeWith(`team-ignite-tour:new-repo`, {
            arguments: [`product-service`, this.applicationName, this.tfs, this.pat]
        });
        this.composeWith(`team-ignite-tour:new-repo`, {
            arguments: [`frontend`, this.applicationName, this.tfs, this.pat]
        });

        // Set up local git repos
        this.composeWith(`team-ignite-tour:git`, {
            arguments: [`web-app-infra`, this.applicationName, this.tfs, `clone`, this.pat]
        });
        this.composeWith(`team-ignite-tour:web-app-infra`, {
            arguments: [this.applicationName]
        });
        this.composeWith(`team-ignite-tour:git`, {
            arguments: [`web-app-infra`, this.applicationName, this.tfs, `commit`, this.pat]
        });
        this.composeWith(`team-ignite-tour:git`, {
            arguments: [`web-app-infra`, this.applicationName, this.tfs, `push`, this.pat]
        });

        this.composeWith(`team-ignite-tour:git`, {
            arguments: [`inventory-service`, this.applicationName, this.tfs, `clone`, this.pat]
        });
        this.composeWith(`team-ignite-tour:inventory-service`, {
            arguments: [this.applicationName]
        });
        this.composeWith(`team-ignite-tour:git`, {
            arguments: [`inventory-service`, this.applicationName, this.tfs, `commit`, this.pat]
        });
        this.composeWith(`team-ignite-tour:git`, {
            arguments: [`inventory-service`, this.applicationName, this.tfs, `push`, this.pat]
        });

        this.composeWith(`team-ignite-tour:git`, {
            arguments: [`product-service`, this.applicationName, this.tfs, `clone`, this.pat]
        });
        this.composeWith(`team-ignite-tour:product-service`, {
            arguments: [this.applicationName]
        });
        this.composeWith(`team-ignite-tour:git`, {
            arguments: [`product-service`, this.applicationName, this.tfs, `commit`, this.pat]
        });
        this.composeWith(`team-ignite-tour:git`, {
            arguments: [`product-service`, this.applicationName, this.tfs, `push`, this.pat]
        });

        this.composeWith(`team-ignite-tour:git`, {
            arguments: [`frontend`, this.applicationName, this.tfs, `clone`, this.pat]
        });
        this.composeWith(`team-ignite-tour:frontend`, {
            arguments: [this.applicationName]
        });
        this.composeWith(`team-ignite-tour:git`, {
            arguments: [`frontend`, this.applicationName, this.tfs, `commit`, this.pat]
        });
        this.composeWith(`team-ignite-tour:git`, {
            arguments: [`frontend`, this.applicationName, this.tfs, `push`, this.pat]
        });

        // Setup Builds
        this.composeWith(`team-ignite-tour:build`, {
            arguments: [`web-app-infra`, this.applicationName, this.tfs, `Hosted VS2017`, this.target, this.azureSub, ``, ``, ``, this.pat, ``]
        });
        this.composeWith(`team-ignite-tour:build`, {
            arguments: [`inventory-service`, this.applicationName, this.tfs, `Hosted Ubuntu 1604`, this.target, this.azureSub, ``, ``, ``, this.pat, ``]
        });
        this.composeWith(`team-ignite-tour:build`, {
            arguments: [`product-service`, this.applicationName, this.tfs, `Hosted Ubuntu 1604`, this.target, this.azureSub, ``, ``, ``, this.pat, ``]
        });
        this.composeWith(`team-ignite-tour:build`, {
            arguments: [`frontend`, this.applicationName, this.tfs, `Hosted Ubuntu 1604`, this.target, this.azureSub, ``, ``, ``, this.pat, ``]
        });

        // Set up KeyVault Variable Group
        this.composeWith(`team-ignite-tour:variable-group`, {
            arguments: [this.applicationName, this.tfs, this.azureSub, this.pat]
        });

        // Setup Releases
        this.composeWith(`team-ignite-tour:release`, {
            arguments: [
                `web-app-infra`,
                this.applicationName,
                this.tfs,
                `Hosted VS2017`,
                this.target,
                this.azureSub,
                this.dockerHost,
                this.dockerRegistry,
                this.dockerRegistryId,
                this.dockerPorts,
                this.dockerRegistryPassword,
                this.pat,
                this.customFolder,
                this.clusterName,
                this.clusterResourceGroup
            ]
        });
        this.composeWith(`team-ignite-tour:release`, {
            arguments: [
                `inventory-service`,
                this.applicationName,
                this.tfs,
                `Hosted VS2017`,
                this.target,
                this.azureSub,
                this.dockerHost,
                this.dockerRegistry,
                this.dockerRegistryId,
                this.dockerPorts,
                this.dockerRegistryPassword,
                this.pat,
                this.customFolder,
                this.clusterName,
                this.clusterResourceGroup
            ]
        });
        this.composeWith(`team-ignite-tour:release`, {
            arguments: [
                `product-service`,
                this.applicationName,
                this.tfs,
                `Hosted VS2017`,
                this.target,
                this.azureSub,
                this.dockerHost,
                this.dockerRegistry,
                this.dockerRegistryId,
                this.dockerPorts,
                this.dockerRegistryPassword,
                this.pat,
                this.customFolder,
                this.clusterName,
                this.clusterResourceGroup
            ]
        });
        this.composeWith(`team-ignite-tour:release`, {
            arguments: [
                `frontend`,
                this.applicationName,
                this.tfs,
                `Hosted VS2017`,
                this.target,
                this.azureSub,
                this.dockerHost,
                this.dockerRegistry,
                this.dockerRegistryId,
                this.dockerPorts,
                this.dockerRegistryPassword,
                this.pat,
                this.customFolder,
                this.clusterName,
                this.clusterResourceGroup
            ]
        });
    }
};
