import fs from 'node:fs';
const catalog={};
for(const name of ['translations.tsv','offline-translations.tsv']){
 for(const line of fs.readFileSync('client/'+name,'utf8').split(/\r?\n/).filter(x=>x.trim())){
  const row=line.split('|').map(x=>x.trim());if(row.length!==3||row.some(x=>!x))throw Error('Invalid translation row in '+name);
  const [key,zh,en]=row;const value={'zh-CN':zh,en};if(catalog[key]&&JSON.stringify(catalog[key])!==JSON.stringify(value))throw Error('Conflicting translation: '+key);catalog[key]=value;
 }
}
fs.writeFileSync('client/translations.json',JSON.stringify(catalog,null,2)+'\n');console.log('Locale catalog: '+Object.keys(catalog).length+' entries');
