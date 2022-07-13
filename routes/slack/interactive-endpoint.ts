import { HandlerContext } from "$fresh/server.ts";
import { GitHub } from "../../communication/github.ts";
import { SlackRequest } from "../../communication/slack-types.ts";
import moment from "https://deno.land/x/momentjs@2.29.1-deno/mod.ts";

const appId = '219392'; // https://github.com/apps/pooled-notifications

const owner = 'austenstone';
const repo = 'pooled-notif-test';
const token = Deno.env.get("GITHUB_TOKEN");
if (!token) {
  Deno.exit(1);
}

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

  const client = new GitHub();
  await client.initalize(appId);

  client.issueUpdateAssignees(owner, repo, issueNumber, [data.user.username]).then(async (rsp) => {
    const rspData = await rsp.json();
    const createdAt = new Date(rspData.created_at);
    const updatedAt = new Date(rspData.updated_at);
    const duration = Math.abs(updatedAt - createdAt);
    const durationStr = moment.duration(duration).humanize();
    fetch(data.response_url, {
      method: 'POST',
      body: JSON.stringify({
        "replace_original": "true",
        text: `Pooled issue <${htmlUrl}|${issueTitle} #${issueNumber}> assigned to <https://github.com/${data.user.username}|@${data.user.username}> ${durationStr} after creation.`
      }),
      headers: { "Content-Type": "application/json" }
    }).then((rsp) => console.debug('<- github', rsp));
  }).catch((e) => {
    throw new Error(e.message ? e.message : JSON.stringify(e));
  });

  return new Response(null);
};
