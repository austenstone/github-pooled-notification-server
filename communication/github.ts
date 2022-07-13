import { create } from "https://deno.land/x/djwt/mod.ts";

const GH_API_URL = "https://api.github.com";
export class GitHub {
  jwt?: string;
  installationId?: number;
  token?: string;

  constructor() {
  }

  _request(method: string, url: string, body?: any, init?: RequestInit) {
    return fetch(GH_API_URL + url, {
      method,
      body: JSON.stringify(body),
      headers: {
        'Authorization': `token ${this.token}`,
        'Accept': "application/vnd.github+json",
        ...init?.headers
      },
      ...init
    });
  }

  request(method: string, url: string, body?: any, init?: RequestInit) {
    return this._request(method, url, body, {
      headers: { 'Authorization': `token ${this.token}` },
      ...init
    });
  }

  bearerRequest(method: string, url: string, body?: any, init?: RequestInit) {
    return this._request(method, url, body, {
      headers: { 'Authorization': `Bearer ${this.jwt}` },
      ...init
    });
  }

  issueUpdateAssignees(owner: string, repo: string, issueNumber: number, assignees: string[]) {
    return this.request('POST', `/repos/${owner}/${repo}/issues/${issueNumber}/assignees`, {
      assignees
    });
  }

  async initialize(appId: string, repoOwnerId: string) {
    await this.createJwt(appId);

    const installationsRsp = await this.getInstallations();
    if (installationsRsp.ok) {
      const installations = await installationsRsp.json();
      const foundInstall = installations.find((i) => i.target_id === repoOwnerId);
      if (foundInstall) {
        await this.setInstallationId(foundInstall.id);
        await this.getAccessToken();
      }
    }
  }

  getInstallationRepositories() {
    return this.request('GET', '/installation/repositories');
  }

  getInstallations() {
    return this.bearerRequest('GET', '/app/installations');
  }

  setInstallationId(installationId: number) {
    this.installationId = installationId;
  }

  async getAccessToken(): Promise<void> {
    const rsp = await this.bearerRequest('POST', `/app/installations/${this.installationId}/access_tokens`);
    const accessTokens = await rsp.json();
    this.token = accessTokens.token;
  }

  // The private keys provided by GitHub are in PKCS#1 format, but the WebCrypto API only supports PKCS#8.
  // You need to convert it first:
  // $ openssl pkcs8 -topk8 -inform PEM -outform PEM -nocrypt -in private-key.pem -out private-key-pkcs8.key
  async createJwt(appId: string) {
    const str2ab = (str: string) => {
      const buf = new ArrayBuffer(str.length);
      const bufView = new Uint8Array(buf);
      for (let i = 0, strLen = str.length; i < strLen; i++) {
        bufView[i] = str.charCodeAt(i);
      }
      return buf;
    }
    const pem = await Deno.env.get('GITHUB_APP_PRIVATE_KEY');
    if (!pem) throw new Error('GITHUB_APP_PRIVATE_KEY not set');
    const pemHeader = "-----BEGIN PRIVATE KEY-----";
    const pemFooter = "-----END PRIVATE KEY-----";
    const pemContents = pem.substring(
      pemHeader.length,
      pem.length - pemFooter.length,
    );
    // base64 decode the string to get the binary data
    const binaryDerString = atob(pemContents);
    // convert from a binary string to an ArrayBuffer
    const binaryDer = str2ab(binaryDerString);
    const key = await crypto.subtle.importKey(
      "pkcs8",
      binaryDer,
      {
        name: "RSASSA-PKCS1-v1_5",
        hash: "SHA-256"
      },
      true,
      ["sign"]
    );
    const nowSeconds = Math.round(Date.now() / 1000);
    this.jwt = await create({ alg: "RS256", typ: "JWT" }, {
      iat: nowSeconds - 60,
      exp: nowSeconds + (10 * 60),
      iss: appId
    }, key);
  }

}