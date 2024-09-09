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
// read from file
const fs = require ('fs');
const file;
try {
  file = fs.readFileSync(job_definition_path, 'utf-8');
} catch (err) {
  console.log("Error reading job definition file")
  core.setFailed(err.message);
}
// submit to lava
const https = require('https');

var postData = JSON.stringify({
  'definition' : file
});

if ( github.event_name == 'pull_request' && qa_reports_patch_source ) {
	// create new build with patch source first

	// patch-id = owner/repo/ref
	const patch_id = github.repository + '/' + github.sha
	var options = {
	  hostname: qa_reports_url,
	  port: 443,
	  path: '/api/createbuild/' + qa_reports_group + '/' + qa_reports_project + '/' + qa_reports_build,
	  method: 'POST',
	  headers: {
		   'Content-Type': 'application/json',
		   'Content-Length': postData.length,
		   'Auth-Token': qa_reports_token
		 },
	  data: {
		  'patch_id': patch_id,
		  'patch_source': qa_reports_patch_source
	     }

	};
	var req1 = https.request(options, (res) => {
	  console.log('statusCode:', res.statusCode);
	  console.log('headers:', res.headers);

	  res.on('data', (d) => {
		process.stdout.write(d);
	  });
	});

	req1.on('error', (e) => {
	  console.error(e);
	  core.setFailed(e.message);
	});

	req1.write(postData);
	req1.end();
}

var options = {
  hostname: qa_reports_url,
  port: 443,
  path: '/api/submitjob/' + qa_reports_group + '/' + qa_reports_project + '/' + qa_reports_build + '/' + qa_reports_environment,
  method: 'POST',
  headers: {
       'Content-Type': 'application/json',
       'Content-Length': postData.length,
       'Auth-Token': qa_reports_token
     }
};

var req2 = https.request(options, (res) => {
  console.log('statusCode:', res.statusCode);
  console.log('headers:', res.headers);

  res.on('data', (d) => {
    process.stdout.write(d);
  });
});

req2.on('error', (e) => {
  console.error(e);
  core.setFailed(e.message);
});

req2.write(postData);
req2.end();

