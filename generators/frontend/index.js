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
        var root = `frontend`

        // Root files
        this.fs.copy(`${src}/src`, `${root}/src`);
        this.fs.copy(`${src}/.dockerignore`, `${root}/.dockerignore`);
        this.fs.copy(`${src}/dotenv`, `${root}/.env`);
        this.fs.copy(`${src}/.eslintrc.json`, `${root}/.eslintrc.json`);
        this.fs.copy(`${src}/docker-startup.sh`, `${root}/docker-startup.sh`);
        this.fs.copy(`${src}/Dockerfile`, `${root}/Dockerfile`);
        this.fs.copy(`${src}/frontend-multistage.Dockerfile`, `${root}/frontend-multistage.Dockerfile`);
        this.fs.copy(`${src}/frontend.Dockerfile`, `${root}/frontend.Dockerfile`);
        this.fs.copy(`${src}/package-lock.json`, `${root}/package-lock.json`);
        this.fs.copy(`${src}/package.json`, `${root}/package.json`);
        this.fs.copy(`${src}/README.md`, `${root}/README.md`);


    }
};