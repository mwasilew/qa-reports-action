const core = require('@actions/core');
const github = require('@actions/github');

const job_definition_path = core.getInput('job_definition', { required: true })
const qa_reports_token = core.getInput('qa_reports_token', { required: true })
const qa_reports_url = core.getInput('qa_reports_url', { required: true })
const qa_reports_group = core.getInput('qa_reports_group', { required: true })
const qa_reports_project = core.getInput('qa_reports_project', { required: true })
const qa_reports_environment = core.getInput('qa_reports_environment', { required: true })
const qa_reports_build = core.getInput('qa_reports_build', { required: true })
const qa_reports_patch_source = core.getInput('qa_reports_patch_source')
const qa_reports_lava_backend = core.getInput('qa_reports_lava_backend', { required: true })
// read from file
const fs = require ('fs');
var file;
try {
  file = fs.readFileSync(job_definition_path, 'utf-8');
} catch (err) {
  console.log("Error reading job definition file")
  core.setFailed(err.message);
}
// submit to lava
const request = require('request');

function callback(error, response, body) {
  if (error) {
      console.log(error)
      core.setFailure(error)
  }
  if (response.statusCode != 201) {
      console.log(body)
      core.setFailure(response.statusCode)
  }
}

if ( qa_reports_patch_source ) {
    // create new build with patch source first

    // patch-id = owner/repo/ref
    const patch_id = github.repository + '/' + github.sha
    var options = {
      url: 'https://' + qa_reports_url + '/api/createbuild/' + qa_reports_group + '/' + qa_reports_project + '/' + qa_reports_build,
      method: 'POST',
      headers: {
           'Auth-Token': qa_reports_token
         },
      form: {
          'patch_id': patch_id,
          'patch_source': qa_reports_patch_source
        }
    };
    request(options, callback)
}

var options = {
  url: 'https://' + qa_reports_url + '/' + '/api/submitjob/' + qa_reports_group + '/' + qa_reports_project + '/' + qa_reports_build + '/' + qa_reports_environment,
  method: 'POST',
  headers: {
       'Auth-Token': qa_reports_token
     },
  form: {
      'backend' : qa_reports_lava_backend,
      'definition' : file
     }
};

request(options, callback)
