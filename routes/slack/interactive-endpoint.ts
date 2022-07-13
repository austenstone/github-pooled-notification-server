import { HandlerContext } from "$fresh/server.ts";
import { GitHub } from "../../communication/github.ts";
import { SlackRequest } from "../../communication/slack-types.ts";
import moment from "https://deno.land/x/momentjs@2.29.1-deno/mod.ts";
import { create } from "https://deno.land/x/djwt/mod.ts";
import * as base64 from "https://deno.land/std@0.140.0/encoding/base64.ts";


function str2ab(str) {
  const buf = new ArrayBuffer(str.length);
  const bufView = new Uint8Array(buf);
  for (let i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}

const pem = await Deno.readTextFileSync("./private-key.pem");
const pemHeader = "-----BEGIN RSA PRIVATE KEY-----\n";
const pemFooter = "\n-----END RSA PRIVATE KEY-----";
const pemContents = pem.substring(
  pemHeader.length,
  pem.length - pemFooter.length,
);
// base64 decode the string to get the binary data
const binaryDerString = atob(pemContents);
// convert from a binary string to an ArrayBuffer
const binaryDer = str2ab(binaryDerString);
console.log('pemContents', pemContents);
const key = await crypto.subtle.importKey("raw", binaryDer, { name: "RSA-PSS", hash: "SHA-256" }, true, ["sign"]);
// const jwt = await create({ alg: "RS256", typ: "JWT" }, {
//   iat: Date.now() - 60,
//   exp: Date.now() + (10 * 60),
//   iss: "YOUR_APP_ID"
// }, key);
// console.log(jwt);

const owner = 'austenstone';
const repo = 'pooled-notif-test';
const token = Deno.env.get("GITHUB_TOKEN");
if (!token) {
  Deno.exit(1);
}
const client = new GitHub(token);

const getReqData = async (req: Request) => {
  const text = await req.text();
  const jsonText = decodeURIComponent(text).slice(8);
  return JSON.parse(jsonText);
}

export const handler = async (_req: Request, _ctx: HandlerContext): Promise<Response> => {
  const data: SlackRequest = await getReqData(_req);
  console.debug('<- slack', data);

  const payload = data.message.metadata.event_payload;
  const issueNumber = parseInt(payload.number);
  const issueTitle = payload.title.replace(/\+/g, ' ');
  const htmlUrl = payload.html_url;

  if (isNaN(issueNumber)) throw new Error('Invalid issue number: ' + data.message.text);

  client.issueUpdateAssignees(owner, repo, issueNumber, [data.user.username]).then(async (rsp) => {
    const rspData = await rsp.json();
    const createdAt = new Date(rspData.created_at);
    const updatedAt = new Date(rspData.updated_at);
    const duration = Math.abs(updatedAt - createdAt);
    const durationStr = moment.duration(duration).humanize();
    // fetch(data.response_url, {
    //   method: 'POST',
    //   body: JSON.stringify({
    //     "replace_original": "true",
    //     text: `Pooled issue <${htmlUrl}|${issueTitle} #${issueNumber}> assigned to <https://github.com/${data.user.username}|@${data.user.username}> ${durationStr} after creation.`
    //   }),
    //   headers: { "Content-Type": "application/json" }
    // }).then((rsp) => console.debug('<- github', rsp));
  }).catch((e) => {
    throw new Error(e.message ? e.message : JSON.stringify(e));
  });

  return new Response(null);
};
