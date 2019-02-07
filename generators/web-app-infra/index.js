const Generator = require('yeoman-generator');
const argUtils = require(`generator-team/generators/app/args`);
const prompts = require(`generator-team/generators/app/prompt`);
const util = require(`generator-team/generators/app/utility`);

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
        var root = `web-app-infra`

        // Root files
        this.fs.copy(`${src}/parameters.json`, `${root}/parameters.json`);
        this.fs.copy(`${src}/template.json`, `${root}/template.json`);
    }
};