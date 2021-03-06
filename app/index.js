'use strict';
var yeoman = require('yeoman-generator');
var yosay = require('yosay');
var chalk = require('chalk');
var mkdirp = require('mkdirp');
var path = require('path');
var guid = require('uuid');
var projectName = require('vs_projectname');
var merge = require('merge'),
    original, cloned;
var glob = require("glob");
var fs = require("fs");
var AspnetGenerator = yeoman.generators.Base.extend({

    constructor: function() {
        yeoman.generators.Base.apply(this, arguments);

        this.argument('type', { type: String, required: false, desc: 'the project type to create' });
        this.argument('applicationName', { type: String, required: false, desc: 'the name of the application' });
        this.argument('SiteName', { type: String, required: false, desc: 'the name of the site' });
        this.argument('SiteNameShort', { type: String, required: false, desc: 'the short name of the site' });
        this.argument('ApplicationHostUrl', { type: String, required: false, desc: 'the url of the site' });
        this.argument('ui', { type: String, required: false, defaults: 'bootstrap', desc: 'the ui library to use (bootstrap OR semantic)' });
        this.argument('features', { type: String, required: false, defaults: 'all', desc: 'What features to include on the app' });
    },


    init: function() {
        this.log(yosay('Welcome to the marvellous ASP.NET Core generator!'));
        this.templatedata = {};
    },

    _checkProjectType: function() {
        if (this.type) {
            //normalize to lower case
            this.type = this.type.toLowerCase();
            var validProjectTypes = [
                'emptyweb',
                'consoleapp',
                'web',
                'webbasic',
                'webapi',
                'nancy',
                'classlibrary',
                'unittest',
            ];

            if (validProjectTypes.indexOf(this.type) === -1) {
                //if it's not in the list, send them through the normal path
                this.log('"%s" is not a valid project type', chalk.cyan(this.type));
                this.type = undefined;
                this.applicationName = undefined;
                this.SiteName = undefined;
                this.SiteNameShort = undefined;
                this.ApplicationHostUrl = undefined;
            } else {
                this.log('Creating "%s" project', chalk.cyan(this.type));
            }
        }
    },

    askFor: function() {
        this._checkProjectType();
        if (!this.type) {
            var done = this.async();

            var prompts = [{
                    type: 'list',
                    name: 'type',
                    message: 'What type of application do you want to create?',
                    choices: [{
                        name: 'Empty Web Application',
                        value: 'emptyweb'
                    }, {
                        name: 'Console Application',
                        value: 'consoleapp'
                    }, {
                        name: 'Web Application',
                        value: 'web'
                    }, {
                        name: 'Web Application Basic [without Membership and Authorization]',
                        value: 'webbasic'
                    }, {
                        name: 'Web API Application',
                        value: 'webapi'
                    }, {
                        name: 'Nancy ASP.NET Application',
                        value: 'nancy'
                    }, {
                        name: 'Class Library',
                        value: 'classlibrary'
                    }, {
                        name: 'Unit test project (xUnit.net)',
                        value: 'unittest'
                    }]
                },

                {
                    type: 'list',
                    name: 'ui',
                    message: 'Which UI framework would you like to use?',
                    default: 'bootstrap',
                    choices: [{
                            name: 'Bootstrap (3.3.6)',
                            value: 'bootstrap'
                        },
                        {
                            name: 'Semantic UI (2.1.8)',
                            value: 'semantic'
                        }
                    ],
                    when: function(answers) {
                        return answers.type === 'web' || answers.type === 'webbasic';
                    }

                },
                {
                    type: 'checkbox',
                    name: 'features',
                    message: 'What features',
                    default: ['all'],
                    choices: [{
                            name: 'All',
                            value: 'all'
                        },
                        {
                            name: 'DataTable indexes',
                            value: 'datatable_indexes'
                        },
                        {
                            name: 'Swagger API docs',
                            value: 'swagger'
                        },
                        {
                            name: 'Ajax Api',
                            value: 'ajax'
                        },
                        {
                            name: 'Import/Export Api',
                            value: 'import_export'
                        },
                        {
                            name: 'CSV support',
                            value: 'csv'
                        },
                        {
                            name: 'Charting and graphing',
                            value: 'hicharts'
                        },
                        {
                            name: 'Markdown Support',
                            value: 'markdown'
                        },
                        {
                            name: 'ACCESS:: Allow Other WSU RESTful or media consumption (Cors)',
                            value: 'cors'
                        }
                    ],
                    when: function(answers) {
                        return answers.type === 'web' || answers.type === 'webbasic';
                    }

                },
                {
                    type: 'checkbox',
                    name: 'features',
                    message: 'What features',
                    default: ['all'],
                    choices: [{
                            name: 'All',
                            value: 'all'
                        },
                        {
                            name: 'Swagger API docs',
                            value: 'swagger'
                        },
                        {
                            name: 'Ajax Api',
                            value: 'ajax'
                        },
                        {
                            name: 'Import/Export Api',
                            value: 'import_export'
                        },
                        {
                            name: 'CSV support',
                            value: 'csv'
                        },
                        {
                            name: 'ACCESS:: Allow Other WSU RESTful or media consumption (Cors)',
                            value: 'cors'
                        }
                    ],
                    when: function(answers) {
                        return answers.type === 'webapi';
                    }

                }
            ];

            this.prompt(prompts, function(props) {
                this.type = props.type;
                this.ui = props.ui;
                this.features = props.features;
                done();
            }.bind(this));
        }
    },

    _buildTemplateData: function() {
        this.templatedata.namespace = projectName(this.applicationName);
        this.templatedata.applicationname = this.applicationName;
        this.templatedata.ApplicationHostUrl = this.ApplicationHostUrl;
        this.templatedata.SiteName = this.SiteName;
        this.templatedata.SiteNameShort = this.SiteNameShort;
        this.templatedata.guid = guid.v4();
        this.templatedata.sqlite = (this.type === 'web') ? true : false;
        this.templatedata.ui = this.ui;
        this.templatedata.features = this.features;
        this.templatedata.version = "1.0.0-preview2-003131";
    },

    askForName: function() {
        if (!this.applicationName) {
            var done = this.async();
            var app = '';
            switch (this.type) {
                case 'emptyweb':
                    app = 'EmptyWebApplication';
                    break;
                case 'consoleapp':
                    app = 'ConsoleApplication';
                    break;
                case 'web':
                    app = 'WebApplication';
                    break;
                case 'webbasic':
                    app = 'WebApplicationBasic';
                    break;
                case 'webapi':
                    app = 'WebAPIApplication';
                    break;
                case 'nancy':
                    app = 'NancyApplication';
                    break;
                case 'classlibrary':
                    app = 'ClassLibrary';
                    break;
                case 'unittest':
                    app = 'UnitTest';
                    break;
            }
            var prompts = [{
                    name: 'applicationName',
                    message: 'What\'s the name of your ASP.NET application?',
                    default: app
                },
                {
                    name: 'SiteName',
                    message: 'What\'s the web display name? (NOTE: use full department name where possible)',
                    default: app
                },
                {
                    name: 'SiteNameShort',
                    message: 'What\'s the shortest web display name possible? (NOTE: try to keep it to an abbreviation like FAIS)',
                    default: app
                },
                {
                    name: 'ApplicationHostUrl',
                    message: 'What\'s the Base URL',
                    default: app
                }
            ];
            this.prompt(prompts, function(props) {
                this.applicationName = props.applicationName;
                this.SiteName = props.SiteName;
                this.SiteNameShort = props.SiteNameShort;
                this.ApplicationHostUrl = props.ApplicationHostUrl;
                this._buildTemplateData();
                done();
            }.bind(this));
        } else {
            this._buildTemplateData();
        }
    },

    writing: function() {
        this.sourceRoot(path.join(__dirname, './templates/projects'));

        switch (this.type) {

            case 'emptyweb':
                this.sourceRoot(path.join(__dirname, '../templates/projects/' + this.type));

                this.copy(this.sourceRoot() + '/../../gitignore.txt', this.applicationName + '/.gitignore');

                this.template(this.sourceRoot() + '/Program.cs', this.applicationName + '/Program.cs', this.templatedata);

                this.template(this.sourceRoot() + '/Startup.cs', this.applicationName + '/Startup.cs', this.templatedata);

                this.template(this.sourceRoot() + '/project.json', this.applicationName + '/project.json', this.templatedata);

                this.copy(this.sourceRoot() + '/web.config', this.applicationName + '/web.config');

                this.fs.copyTpl(this.sourceRoot() + '/../../Dockerfile.txt', this.applicationName + '/Dockerfile', this.templatedata);
                this.fs.copyTpl(this.sourceRoot() + '/../../Dockerfile.nano.txt', this.applicationName + '/Dockerfile.nano', this.templatedata);

                /// Properties
                this.fs.copyTpl(this.templatePath('Properties/**/*'), this.applicationName + '/Properties', this.templatedata);
                this.fs.copy(this.sourceRoot() + '/README.md', this.applicationName + '/README.md');
                mkdirp.sync(this.applicationName + '/wwwroot');
                this.template(this.sourceRoot() + '/../../global.json', this.applicationName + '/global.json', this.templatedata);
                break;

            case 'webapi':
                this.sourceRoot(path.join(__dirname, '../templates/projects/' + this.type));
                this.fs.copy(this.sourceRoot() + '/../../gitignore.txt', this.applicationName + '/.gitignore');
                this.fs.copyTpl(this.sourceRoot() + '/appsettings.json', this.applicationName + '/appsettings.json', this.templatedata);
                this.fs.copyTpl(this.sourceRoot() + '/../../Dockerfile.txt', this.applicationName + '/Dockerfile', this.templatedata);
                this.fs.copyTpl(this.sourceRoot() + '/../../Dockerfile.nano.txt', this.applicationName + '/Dockerfile.nano', this.templatedata);
                this.fs.copyTpl(this.sourceRoot() + '/Startup.cs', this.applicationName + '/Startup.cs', this.templatedata);
                this.fs.copyTpl(this.sourceRoot() + '/Program.cs', this.applicationName + '/Program.cs', this.templatedata);
                this.fs.copyTpl(this.sourceRoot() + '/project.json', this.applicationName + '/project.json', this.templatedata);
                this.fs.copyTpl(this.templatePath('Properties/**/*'), this.applicationName + '/Properties', this.templatedata);
                this.fs.copyTpl(this.sourceRoot() + '/Controllers/ValuesController.cs', this.applicationName + '/Controllers/ValuesController.cs', this.templatedata);
                this.fs.copy(this.sourceRoot() + '/web.config', this.applicationName + '/web.config');
                this.fs.copy(this.sourceRoot() + '/README.md', this.applicationName + '/README.md');
                mkdirp.sync(this.applicationName + '/wwwroot');
                this.template(this.sourceRoot() + '/../../global.json', this.applicationName + '/global.json', this.templatedata);
                break;

            case 'web':
                this.sourceRoot(path.join(__dirname, '../templates/projects/' + this.type));
                // individual files (configs, etc)
                this.fs.copyTpl(this.sourceRoot() + '/../../Dockerfile.txt', this.applicationName + '/Dockerfile', this.templatedata);
                this.fs.copyTpl(this.sourceRoot() + '/../../Dockerfile.nano.txt', this.applicationName + '/Dockerfile.nano', this.templatedata);
                this.fs.copy(this.templatePath('.bowerrc'), this.applicationName + '/.bowerrc');
                this.fs.copy(this.sourceRoot() + '/../../gitignore.txt', this.applicationName + '/.gitignore');
                this.fs.copyTpl(this.templatePath('appsettings.json'), this.applicationName + '/appsettings.json', this.templatedata);
                this.fs.copyTpl(this.templatePath('sitesettings.json'), this.applicationName + '/sitesettings.json', this.templatedata);
                this.fs.copyTpl(this.templatePath('bower.json'), this.applicationName + '/bower.json', this.templatedata);
                this.fs.copy(this.templatePath('bundleconfig.json'), this.applicationName + '/bundleconfig.json');
                this.fs.copyTpl(this.templatePath('Program.cs'), this.applicationName + '/Program.cs', this.templatedata);
                this.fs.copyTpl(this.templatePath('project.json'), this.applicationName + '/project.json', this.templatedata);
                this.fs.copy(this.templatePath('README.md'), this.applicationName + '/README.md');
                this.fs.copyTpl(this.templatePath('Startup.cs'), this.applicationName + '/Startup.cs', this.templatedata);
                // Controllers
                this.fs.copyTpl(this.templatePath('Controllers/AccountController.cs'), this.applicationName + '/Controllers/AccountController.cs', this.templatedata);
                this.fs.copyTpl(this.templatePath('Controllers/HomeController.cs'), this.applicationName + '/Controllers/HomeController.cs', this.templatedata);
                this.fs.copyTpl(this.templatePath('Controllers/ManageController.cs'), this.applicationName + '/Controllers/ManageController.cs', this.templatedata);
                // Migrations
                this.fs.copyTpl(this.templatePath('Data/Migrations/00000000000000_CreateIdentitySchema.Designer.cs'), this.applicationName + '/Data/Migrations/00000000000000_CreateIdentitySchema.Designer.cs', this.templatedata);
                this.fs.copyTpl(this.templatePath('Data/Migrations/00000000000000_CreateIdentitySchema.cs'), this.applicationName + '/Data/Migrations/00000000000000_CreateIdentitySchema.cs', this.templatedata);
                this.fs.copyTpl(this.templatePath('Data/Migrations/ApplicationDbContextModelSnapshot.cs'), this.applicationName + '/Data/Migrations/ApplicationDbContextModelSnapshot.cs', this.templatedata);
                this.fs.copyTpl(this.templatePath('Data/ApplicationDbContext.cs'), this.applicationName + '/Data/ApplicationDbContext.cs', this.templatedata);
                // Models
                this.fs.copyTpl(this.templatePath('Models/ApplicationUser.cs'), this.applicationName + '/Models/ApplicationUser.cs', this.templatedata);
                this.fs.copyTpl(this.templatePath('Models/AccountViewModels/**/*'), this.applicationName + '/Models/AccountViewModels', this.templatedata);
                this.fs.copyTpl(this.templatePath('Models/ManageViewModels/**/*'), this.applicationName + '/Models/ManageViewModels', this.templatedata);
                this.fs.copyTpl(this.templatePath('Models/UI/**/*'), this.applicationName + '/Models/UI', this.templatedata);
                // Configuration
                this.fs.copyTpl(this.templatePath('Configuration/**/*'), this.applicationName + '/Configuration', this.templatedata);
                // Properties
                this.fs.copyTpl(this.templatePath('Properties/**/*'), this.applicationName + '/Properties', this.templatedata);
                // Services
                this.fs.copyTpl(this.templatePath('Services/IEmailSender.cs'), this.applicationName + '/Services/IEmailSender.cs', this.templatedata);
                this.fs.copyTpl(this.templatePath('Services/ISmsSender.cs'), this.applicationName + '/Services/ISmsSender.cs', this.templatedata);
                this.fs.copyTpl(this.templatePath('Services/MessageServices.cs'), this.applicationName + '/Services/MessageServices.cs', this.templatedata);
                // Views
                var views_copy_options = { ignore: [] };
                if (this.templatedata.features.indexOf('all') === -1 && this.templatedata.features.indexOf('datatable_indexes') === -1) {
                    views_copy_options["ignore"].push('_datatables.cshtml');
                    views_copy_options["ignore"].push('/_datatables.cshtml');
                    views_copy_options["ignore"].push('Shared/_datatables.cshtml');
                    views_copy_options["ignore"].push('/Shared/_datatables.cshtml');
                }

                this.log(chalk.green('views_copy_options'));
                this.log(chalk.green(views_copy_options.ignore));
                this.fs.copyTpl(this.templatePath('Views/**/*'), this.applicationName + '/Views', this.templatedata, { debug: true }, { globOptions: views_copy_options });
                /*this.log(chalk.green(views_copy_options.ignore[0]));
                if ("undefined" !== typeof views_copy_options.ignore[0]) {
                    this.log(chalk.green('to delete'));
                    this.log(chalk.green(views_copy_options.ignore));
                    views_copy_options.ignore.forEach(function(_item) {
                        this.fs.delete(_item, { cwd: this.applicationName + '/Views' });
                    });
                }*/



                this.fs.copyTpl(this.templatePath('Theme/**/*'), this.applicationName + '/Theme', this.templatedata);
                //Scaffolding\Templates
                var template_copy_options = { ignore: [] };
                this.fs.copyTpl(this.templatePath('Templates/**/*'), this.applicationName + '/Templates', this.templatedata, {}, { globOptions: template_copy_options });
                // wwwroot
                // wwwroot - the content in the wwwroot does not include any direct references or imports
                // So again it is copied 1-to-1 - but tests cover list of all files
                this.fs.copy(this.templatePath('wwwroot/**/*'), this.applicationName + '/wwwroot');
                this.fs.copy(this.templatePath('web.config'), this.applicationName + '/web.config');
                // UI Component Overrides
                // If the developer has placed anything in overrides/ui-module/project-type/**/* then use it
                this.fs.copyTpl(this.templatePath('/../../overrides/' + this.ui + '/' + this.type + '/**/*'), this.applicationName + '/', this.templatedata);
                this.template(this.sourceRoot() + '/../../global.json', this.applicationName + '/global.json', this.templatedata);
                break;
            case 'webbasic':
                this.sourceRoot(path.join(__dirname, '../templates/projects/' + this.type));
                // individual files (configs, etc)
                this.fs.copyTpl(this.sourceRoot() + '/../../Dockerfile.txt', this.applicationName + '/Dockerfile', this.templatedata);
                this.fs.copyTpl(this.sourceRoot() + '/../../Dockerfile.nano.txt', this.applicationName + '/Dockerfile.nano', this.templatedata);
                this.fs.copy(this.templatePath('.bowerrc'), this.applicationName + '/.bowerrc');
                this.fs.copy(this.templatePath('bundleconfig.json'), this.applicationName + '/bundleconfig.json');
                this.fs.copy(this.sourceRoot() + '/../../gitignore.txt', this.applicationName + '/.gitignore');
                this.fs.copyTpl(this.templatePath('bower.json'), this.applicationName + '/bower.json', this.templatedata);
                this.fs.copyTpl(this.templatePath('appsettings.json'), this.applicationName + '/appsettings.json', this.templatedata);
                this.fs.copyTpl(this.templatePath('project.json'), this.applicationName + '/project.json', this.templatedata);
                this.fs.copyTpl(this.templatePath('Program.cs'), this.applicationName + '/Program.cs', this.templatedata);
                // Properties
                this.fs.copyTpl(this.templatePath('Properties/**/*'), this.applicationName + '/Properties', this.templatedata);
                this.fs.copy(this.templatePath('README.md'), this.applicationName + '/README.md');
                this.fs.copyTpl(this.templatePath('Startup.cs'), this.applicationName + '/Startup.cs', this.templatedata);
                this.fs.copyTpl(this.templatePath('web.config'), this.applicationName + '/web.config', this.templatedata);
                // Controllers
                this.fs.copyTpl(this.templatePath('Controllers/HomeController.cs'), this.applicationName + '/Controllers/HomeController.cs', this.templatedata);
                // Views
                this.fs.copyTpl(this.templatePath('Views/**/*'), this.applicationName + '/Views', this.templatedata);

                // wwwroot - the content in the wwwroot does not include any direct references or imports
                // So again it is copied 1-to-1 - but tests cover list of all files
                this.fs.copy(this.templatePath('wwwroot/**/*'), this.applicationName + '/wwwroot');

                // UI Component Overrides
                // If the developer has placed anything in overrides/ui-module/project-type/**/* then use it
                this.fs.copyTpl(this.templatePath('/../../overrides/' + this.ui + '/' + this.type + '/**/*'), this.applicationName + '/', this.templatedata);
                this.template(this.sourceRoot() + '/../../global.json', this.applicationName + '/global.json', this.templatedata);
                break;
            case 'nancy':
                this.sourceRoot(path.join(__dirname, '../templates/projects/' + this.type));

                this.copy(this.sourceRoot() + '/../../gitignore.txt', this.applicationName + '/.gitignore');

                this.template(this.sourceRoot() + '/Startup.cs', this.applicationName + '/Startup.cs', this.templatedata);

                this.fs.copyTpl(this.sourceRoot() + '/project.json', this.applicationName + '/project.json', this.templatedata);

                this.template(this.sourceRoot() + '/HomeModule.cs', this.applicationName + '/HomeModule.cs', this.templatedata);

                this.template(this.sourceRoot() + '/Program.cs', this.applicationName + '/Program.cs', this.templatedata);
                this.template(this.sourceRoot() + '/../../global.json', this.applicationName + '/global.json', this.templatedata);
                break;
            case 'consoleapp':
                this.sourceRoot(path.join(__dirname, '../templates/projects/consoleapp'));
                this.fs.copy(path.join(__dirname, '../templates/gitignore.txt'), this.applicationName + '/.gitignore');
                this.fs.copyTpl(this.templatePath('Program.cs'), this.applicationName + '/Program.cs', this.templatedata);
                this.fs.copyTpl(this.templatePath('project.json'), this.applicationName + '/project.json', this.templatedata);
                this.template(this.sourceRoot() + '/../../global.json', this.applicationName + '/global.json', this.templatedata);
                break;
            case 'classlibrary':
                this.sourceRoot(path.join(__dirname, '../templates/projects/' + this.type));

                this.copy(this.sourceRoot() + '/../../gitignore.txt', this.applicationName + '/.gitignore');

                this.template(this.sourceRoot() + '/class.cs', this.applicationName + '/Class1.cs', this.templatedata);

                this.fs.copyTpl(this.sourceRoot() + '/project.json', this.applicationName + '/project.json', this.templatedata);
                this.template(this.sourceRoot() + '/../../global.json', this.applicationName + '/global.json', this.templatedata);
                break;
            case 'unittest':
                this.sourceRoot(path.join(__dirname, '../templates/projects/' + this.type));
                this.copy(this.sourceRoot() + '/../../gitignore.txt', this.applicationName + '/.gitignore');
                this.fs.copyTpl(this.templatePath('**.*'), this.destinationPath(this.applicationName), this.templatedata);
                this.template(this.sourceRoot() + '/../../global.json', this.applicationName + '/global.json', this.templatedata);
                break;

            default:
                this.log('Unknown project type');
        }
    },

    /**
     * Called on the very end of Yo execution
     * Dependencies are installed only for web type
     * of projects that depends on client side libraries
     * and tools like Gulp or Grunt
     * Uses can skip installing dependencies using built-in yo
     * --skip-install option
     */
    end: function() {
        if (!this.options['skip-install'] && (this.type === 'web' || this.type === 'webbasic')) {
            process.chdir(this.applicationName);
            this.installDependencies({
                npm: false,
                bower: true,
                callback: this._showUsageHints.bind(this)
            });
        } else {
            this._showUsageHints();
        }
    },

    /**
     * Shows usage hints to end user
     * Called on the very end of all processes
     */
    _showUsageHints: function() {
        this.log('\r\n');
        this.log('Your project is now created, you can use the following commands to get going');
        this.log(chalk.green('    cd "' + this.applicationName + '"'));
        this.log(chalk.green('    dotnet restore'));
        this.log(chalk.green('    dotnet build') + ' (optional, build will also happen when it\'s run)');
        if (this.type === 'web') {
            this.log(chalk.green('    dotnet ef database update') + ' (to create the SQLite database for the project)');
        }
        switch (this.type) {
            case 'consoleapp':
                this.log(chalk.green('    dotnet run'));
                break;
            case 'emptyweb':
            case 'nancy':
            case 'web':
            case 'webapi':
            case 'webbasic':
                this.log(chalk.green('    dotnet run'));
                break;
            case 'unittest':
                this.log(chalk.green('    dotnet test'));
                break;
        }

        this.log('\r\n');
    }
});

module.exports = AspnetGenerator;