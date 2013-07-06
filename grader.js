#!/usr/bin/env node

var util = require('util');
var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var rest = require('restler');
var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";
var URL_DEFAULT = "http://evening-dusk-5911.herokuapp.com";

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
	console.log("%s does not exist. Exiting.", instr);
	process.exit(1); // http://nodejs.org/process.html#process_process_exit_code
    }
    return instr;
};

var cheerioHtmlFile = function(htmlfile) {
    return cheerio.load(fs.readFileSync(htmlfile));
};

var buildfn = function(checksfile) {
    var responseHandler = function(result, response) {
	if(result instanceof Error) {
	    console.error('Error: ' + util.format(response.message));
	} else {
	    console.error('Writing temp.html...');
	    fs.writeFileSync("temp.html", result);
	    processHtml("temp.hmtl", checksfile);
	}
    };
    return responseHandler;
};

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlFile = function(htmlfile, checksfile) {
    $ = cheerioHtmlFile(htmlfile);
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for(var ii in checks) {
	var present = $(checks[ii]).length > 0;
	out[checks[ii]] = present;
    }
    return out;
};

var processHtml = function(htmlfile, checksfile) {
    var checkJson = checkHtmlFile(program.file, program.checks);
    var outJson = JSON.stringify(checkJson, null, 4);
    console.log(outJson);
};


var clone = function(fn) {
    // workaround for commander issue (http://stackoverflow.com/a/6772648)
    return fn.bind({});
};

if(require.main == module) {
    program
	.option('-c, --checks <checks_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
	.option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists), HTMLFILE_DEFAULT)
	.option('-u, --url <url>', 'Url of index.html', null, URL_DEFAULT)
	.parse(process.argv);
    if(program.url) {
	console.error('Attempting to get from url...');
	rest.get(util.format(program.url + '/index.html')).on('complete', buildfn(program.checks));
    } else if(program.file) {
	console.error('Attempting to read from file...');
	processHtml(program.file, program.checks);
    }
} else {
    exports.checkHtmlFile = checkHtmlFile;
}
