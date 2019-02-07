const Generator = require('yeoman-generator');
const argUtils = require(`generator-team/generators/app/args`);
const prompts = require(`generator-team/generators/app/prompt`);
const util = require('../app/utility');

module.exports = class extends Generator {

    constructor(args, opts) {
        super(args, opts);

        argUtils.applicationName(this);
        // this.argument(``, {
        //     required: false,
        //     desc: ``
        // });
    }

    prompting() {
        // Collect any missing data from the user.
        // This gives me access to the generator in the
        // when callbacks of prompt
        let cmdLnInput = this;

        return this.prompt([
            prompts.applicationName(this),

        ]).then(function (answers) {
            // Transfer answers to local object for use in the rest of the generator
            this.applicationName = util.reconcileValue(cmdLnInput.options.applicationName, answers.applicationName);
        }.bind(this));
    }

    writing() {
        var src = this.sourceRoot();
        var root = `inventory-service`

        // Root files
        this.fs.copy(`${src}/.editorconfig`, `${root}/.editorconfig`);
        this.fs.copy(`${src}/gitignore.txt`, `${root}/.gitignore`);
        this.fs.copy(`${src}/Dockerfile`, `${root}/Dockerfile`);
        this.fs.copy(`${src}/inventory-service-multistage.Dockerfile`, `${root}/inventory-service-multistage.Dockerfile`);
        this.fs.copy(`${src}/inventory-service.Dockerfile`, `${root}/inventory-service.Dockerfile`);
        this.fs.copy(`${src}/InventoryService.sln`, `${root}/InventoryService.sln`);
        this.fs.copy(`${src}/README.md`, `${root}/README.md`);
        this.fs.copy(`${src}/start-docker.sh`, `${root}/start-docker.sh`);
        this.fs.copy(`${src}/InventoryService.Api`, `${root}/InventoryService.Api`);
        this.fs.copy(`${src}/InventoryService.Tests`, `${root}/InventoryService.Tests`);

    }
};