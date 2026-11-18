import fs from 'node:fs';
import crypto from 'node:crypto';
const read=name=>JSON.parse(fs.readFileSync('output/verification/r12/'+name,'utf8'));
const audit=read('audit-final-all.json'),production=read('audit-final-production.json'),runtime=read('runtime-reachability.json');
const families=[
 {package:'picomatch',severity:'high',advisory:'https://github.com/advisories/GHSA-fc5q-39xc-vjpf',patchedVersion:null,
  paths:['Vite/Vitest/typescript-eslint -> tinyglobby/fdir -> picomatch','sqlite3 -> optional node-gyp -> tinyglobby/fdir -> picomatch'],
  observedBoundary:'Not loaded by the compiled HTTP journey. Dev/test/include globs and node-gyp build/*.sln/build/*.mk patterns are checked-in/tool-owned, not request inputs.',
  decision:'No externally controlled matcher input identified in the current application; retain the audit finding and reassess when upstream publishes a patch or input boundaries change.'},
 {package:'glob',severity:'moderate',advisory:'https://github.com/advisories/GHSA-3g3m-2fjr-6pw4',patchedVersion:'14.0.2',
  paths:['typeorm@0.3.31 -> glob@10.5.0'],
  observedBoundary:'Loaded at startup; TypeORM calls glob.sync with the fixed migrations directory pattern and no AbortSignal options.',
  decision:'Keep the supported ORM branch and record the static-pattern boundary; a major glob/ORM migration is separate work.'},
 {package:'minimatch',severity:'moderate',advisory:'https://github.com/advisories/GHSA-g3hv-75wg-m249',patchedVersion:'11.0.1',
  paths:['typeorm@0.3.31 -> glob@10.5.0 -> minimatch@9.0.9'],
  observedBoundary:'Loaded through TypeORM for fixed trusted migration paths; application routes expose no glob/regex-pattern parameter.',
  decision:'Record the boundary without suppressing npm audit or overriding a parent to an incompatible major.'}
];
const row=(name,v)=>({package:name,severity:v.severity,production:!!production.vulnerabilities[name],via:v.via.map(item=>typeof item==='string'?item:item.url),nodes:v.nodes});
const result={date:'2026-11-18',branch:'feat/r12-dependency-risk-reduction',lockfileSha256:crypto.createHash('sha256').update(fs.readFileSync('package-lock.json')).digest('hex'),
 beforeAll:read('audit-before-all.json').metadata.vulnerabilities,beforeProduction:read('audit-before-production.json').metadata.vulnerabilities,
 afterAll:audit.metadata.vulnerabilities,afterProduction:production.metadata.vulnerabilities,
 remainingPackageEntries:Object.entries(audit.vulnerabilities).map(([name,value])=>row(name,value)),families,
 runtimeProbePassed:runtime.passed,scope:'Current repository/configuration and observed real HTTP journey; no blanket security certification or production release waiver.'};
fs.writeFileSync('output/verification/r12/triage.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({families:families.length,remainingPackageEntries:result.remainingPackageEntries.length,critical:result.afterAll.critical}));
