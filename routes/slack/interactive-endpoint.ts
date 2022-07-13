import { HandlerContext } from "$fresh/server.ts";
import { GitHub } from "../../communication/github.ts";
import { SlackRequest } from "../../communication/slack-types.ts";
import moment from "https://deno.land/x/momentjs@2.29.1-deno/mod.ts";

const appId = '219392'; // https://github.com/apps/pooled-notifications

export const handler = async (_req: Request, _ctx: HandlerContext): Promise<Response> => {
  const text = await _req.text();
  const jsonText = decodeURIComponent(text).slice(8);
  const data: SlackRequest = JSON.parse(jsonText);
  console.debug('<- slack', data);

  const payload = data.message.metadata.event_payload;
  const issueNumber = parseInt(payload.number);
  if (isNaN(issueNumber)) throw new Error('Invalid issue number: ' + data.message.text);
  const issueTitle = payload.title.replace(/\+/g, ' ');
  const htmlUrl = payload.html_url;
  const repoName = payload.repo_name;
  const repoOwner = payload.repo_owner;

  const client = new GitHub();
  await client.initialize(appId);

  client.issueUpdateAssignees(repoOwner, repoName, issueNumber, [data.user.username]).then(async (rsp) => {
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
    }).then(async (rsp) => console.debug('<- slack', await rsp.json()));
  }).catch((e) => {
    throw new Error(e.message ? e.message : JSON.stringify(e));
  });

  return new Response(null);
};
