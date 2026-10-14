import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
const tracked=execFileSync('git',['ls-files','-z'],{encoding:'utf8'}).split('\0').filter(Boolean);
if(!tracked.length)throw Error('Stage release files before running this check');
const forbidden=/^(data|tools|test-results|\.openai|\.codex|\.agents|public\/(cad|reference)|node_modules|\.venv)\/|\.(dwg|dxf|pdf|sqlite(?:-.*)?|pem|key|url|log)$/i;
const secrets=/-----BEGIN (?:RSA |OPENSSH |EC )?PRIVATE KEY-----|github_pat_[A-Za-z0-9_]{20,}|gh[pousr]_[A-Za-z0-9]{30,}|#pair=[a-f0-9]{32,}/;
let bytes=0;for(const file of tracked){if(forbidden.test(file))throw Error('Private artifact staged: '+file);const b=fs.readFileSync(file);bytes+=b.length;if(b.length>2*1024*1024)throw Error('Unexpected large source file: '+file);if(secrets.test(b.toString('utf8')))throw Error('Sensitive content indicator: '+file)}
console.log(JSON.stringify({check:'release-source-scan',files:tracked.length,bytes,privateArtifactIndicators:0,knownSecretIndicators:0,limitations:'Pattern scan is not a guarantee that arbitrary confidential content is absent.'}));
