const Generator = require('yeoman-generator');
const argUtils = require(`generator-team/generators/app/args`);
const prompts = require(`generator-team/generators/app/prompt`);
const util = require('../app/utility');
const app = require(`./app`);

module.exports = class extends Generator {

    constructor(args, opts) {
        super(args, opts);

        this.argument(`repoName`, {
            required: false,
            desc: `Name of the git repository to create`
        });
        argUtils.applicationName(this);
        argUtils.tfs(this);
        argUtils.pat(this);
        
    }

    prompting() {
        // Collect any missing data from the user.
        // This gives me access to the generator in the
        // when callbacks of prompt
        let cmdLnInput = this;

        return this.prompt([
            prompts.applicationName(this),
            prompts.tfs(this),
            prompts.pat(this)
        ]).then(function (answers) {
            this.repoName = util.reconcileValue(cmdLnInput.options.repoName, answers.repoName, ``);
            this.applicationName = util.reconcileValue(cmdLnInput.options.applicationName, answers.applicationName, ``);
            this.tfs = util.reconcileValue(cmdLnInput.options.tfs, answers.tfs, ``);
            this.pat = util.reconcileValue(cmdLnInput.options.pat, answers.pat, ``);
        }.bind(this));
    }

    writing() {
        var args = {
            pat: this.pat,
            tfs: this.tfs,
            repoName: this.repoName,
            project: this.applicationName
        }
        app.run(args, this, this.async());
    }

};