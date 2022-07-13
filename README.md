# fresh project

### Usage

Start the project:

```
deno task start
```

This will watch the project directory and restart as necessary.

### Example GitHub Actions workflow

```yml
# This is a workflow to send a simple slack notification when issue has a pooled label added to it. 
# It is managed and owned by the corp-amer-se team. Specifically @logan-porelle

name: Pooled Request Notification

on:
  issues:
    types:
      - labeled

jobs:
  slack-notification:
    name: Slack Notification
    if: github.event.label.name == 'pooled'
    runs-on: ubuntu-latest
    steps:
      - name: Create message
        uses: actions/github-script@v6
        id: create-message
        with:
          script: |
            return JSON.stringify('*<${{ github.event.issue.html_url }}|#${{ github.event.issue.number }} ${{ github.event.issue.title }}>*').slice(1,-1)
          result-encoding: string
      - name: Slack Send
        uses: slackapi/slack-github-action@34c3fd73326693ef04728f8611669d918a2d781d
        with:
          channel-id: C03GW7Y6YKE
          payload: |
            {
              "text": "New pooled issue created by @${{ github.event.issue.user.login }}",
              "blocks": [{
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "New pooled issue created by @${{ github.event.issue.user.login }}\n${{ steps.create-message.outputs.result }}"
                  }
                },
                {
                  "type": "actions",
                  "elements": [{
                    "type": "button",
                    "text": {
                      "type": "plain_text",
                      "emoji": true,
                      "text": "Assign Me"
                    },
                    "style": "primary",
                    "value": "assign"
                  }]
                }
              ],
              "metadata": {
                "event_type": "issue",
                "event_payload": {
                  "number": "${{ github.event.issue.number }}",
                  "title": "${{ github.event.issue.title }}",
                  "html_url": "${{ github.event.issue.html_url }}",
                  "updated_at": "${{ github.event.issue.updated_at }}",
                  "repo_name": "${{ github.event.repository.name }}",
                  "repo_owner": "${{ github.event.repository.owner.login }}",
                  "repository_owner_id": ${{ github.repository_owner_id }}
                }
              }
            }
        env:
          SLACK_BOT_TOKEN: '${{ secrets.SLACK_POOLED_NOTIF_TOKEN }}'

```          