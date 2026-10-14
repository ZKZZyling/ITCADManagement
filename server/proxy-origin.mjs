export function secureOriginRequest(peer,headers,teamOrigin=''){
 const local=['127.0.0.1','::1','::ffff:127.0.0.1'].includes(peer);if(!local)return false;
 if(headers['x-forwarded-proto']==='https')return true;
 // This provider terminates public TLS but reports proto=http at its next hop.
 // Canonical HTTPS is configured only for the exact locally registered team hostname.
 return /^https:\/\/[a-z0-9-]+\.lhr\.life$/.test(teamOrigin)&&headers.host===new URL(teamOrigin).host;
}
