
const GH_API_URL = "https://api.github.com";
export class GitHub {
  token: string;

  constructor(token: string) {
    this.token = token;
  }

  request(method: string, url: string, body?: any, init?: RequestInit) {
    return fetch(GH_API_URL + url, {
      method,
      body: JSON.stringify(body),
      headers: {
        "Authorization": `token ${this.token}`,
        "Accept": "application/vnd.github+json"
      },
      ...init
    });
  }

  issueUpdateAssignees(owner: string, repo: string, issueNumber: number, assignees: string[]) {
    return this.request('POST', `/repos/${owner}/${repo}/issues/${issueNumber}/assignees`, {
      assignees
    });
  }
}