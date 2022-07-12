import { HandlerContext } from "$fresh/server.ts";
import { GitHub } from "../../github.ts";
import { SlackRequest } from "../../slack-types.ts";

const token = Deno.env.get("GITHUB_TOKEN");
if (!token) {
  Deno.exit(1);
}
const client = new GitHub(token);

const getRequest = async (req: Request) => {
  const text = await req.text();
  const jsonText = decodeURIComponent(text).slice(8);
  return JSON.parse(jsonText);
}

export const handler = async (_req: Request, _ctx: HandlerContext): Promise<Response> => {
  const json: SlackRequest = await getRequest(_req);
  const issueNumber = parseInt(json.message.text.slice(json.message.text.indexOf('#') + 1))
  if (isNaN(issueNumber)) throw new Error('Invalid issue number');
  try {
    await client.issueUpdateAssignees('github', 'solutions-engineering', issueNumber, [json.user.username]);
  } catch (e) {
    throw new Error(e.message ? e.message : JSON.stringify(e));
  }
  return new Response(JSON.stringify({
    "text": "Thanks for your request, we'll process it and get back to you."
  }), {
    headers: {
      "Content-Type": "application/json"
    }
  });
};