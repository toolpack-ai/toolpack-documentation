---
sidebar_position: 13
sidebar_label: 'Slack'
description: "Toolpack SDK Slack tools for posting messages, reading channel history, managing threads, and adding reactions via the Slack Web API."
keywords: [slack tools, Slack Web API, post message, channel history, thread replies, reactions, Toolpack SDK Slack]
---

# Slack Tools

Category: `network` · 6 tools

Slack Web API tools — post messages, reply in threads, react to messages, read channel history, read thread replies, and verify bot identity.

## Setup

### Environment Variable

Set your Slack bot token before using these tools:

```bash
export TOOLPACK_SLACK_BOT_TOKEN=xoxb-your-bot-token
```

All tools read `TOOLPACK_SLACK_BOT_TOKEN` by default. You can also pass a `token` parameter directly to any tool call to override the environment variable.

### Import

```typescript
import { slackToolsProject } from 'toolpack-sdk';
```

### Wire up with Toolpack

```typescript
import Toolpack from 'toolpack-sdk';
import { slackToolsProject } from 'toolpack-sdk';

const toolpack = await Toolpack.init({
    provider: 'openai',
    tools: true,
    toolProjects: [slackToolsProject],
});
```

## Tools

| Tool | Required Parameters | Optional Parameters | Description |
|------|---------------------|---------------------|-------------|
| `slack.chat.postMessage` | `channel`, `text` | `thread_ts`, `blocks`, `token` | Post a message to a channel or thread |
| `slack.chat.postEphemeral` | `channel`, `user`, `text` | `thread_ts`, `token` | Post a temporary message visible only to a specific user |
| `slack.reactions.add` | `channel`, `timestamp`, `name` | `token` | Add an emoji reaction to a message |
| `slack.conversations.history` | `channel` | `limit`, `oldest`, `latest`, `token` | Fetch recent messages from a channel |
| `slack.conversations.replies` | `channel`, `ts` | `limit`, `oldest`, `latest`, `token` | Fetch all replies in a thread |
| `slack.auth.test` | — | `token` | Verify the bot token and retrieve bot identity |

## Tool Reference

### `slack.chat.postMessage`

Post a message to a Slack channel or thread. Supports plain mrkdwn text and optional Block Kit blocks for rich formatting. Use `thread_ts` to reply inside an existing thread.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `channel` | string | Yes | Channel ID or channel name (e.g. `#general`) |
| `text` | string | Yes | Message text in Slack mrkdwn format. Always required — used as fallback when blocks are provided |
| `thread_ts` | string | No | Timestamp of the parent message to reply in a thread. Omit to post at top level |
| `blocks` | string | No | Optional Block Kit layout as a JSON string. When provided, text is used only as the notification fallback |
| `token` | string | No | Slack bot token. Defaults to `TOOLPACK_SLACK_BOT_TOKEN` env var |

### `slack.chat.postEphemeral`

Post a temporary message visible only to a specific user in a Slack channel. Useful for private confirmations, status updates, or error messages that should not be seen by others.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `channel` | string | Yes | Channel ID where the ephemeral message will appear |
| `user` | string | Yes | Slack user ID of the person who will see the message |
| `text` | string | Yes | Message text in Slack mrkdwn format |
| `thread_ts` | string | No | Timestamp of the parent message to show the ephemeral reply inside a thread |
| `token` | string | No | Slack bot token. Defaults to `TOOLPACK_SLACK_BOT_TOKEN` env var |

### `slack.reactions.add`

Add an emoji reaction to a Slack message. Useful for acknowledging receipt, signalling completion, or flagging issues. Requires the `reactions:write` OAuth scope on the Slack app.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `channel` | string | Yes | Channel ID containing the message to react to |
| `timestamp` | string | Yes | Timestamp of the message to react to |
| `name` | string | Yes | Emoji name without colons (e.g. `"eyes"`, `"white_check_mark"`, `"warning"`, `"x"`) |
| `token` | string | No | Slack bot token. Defaults to `TOOLPACK_SLACK_BOT_TOKEN` env var |

### `slack.conversations.history`

Fetch recent messages from a Slack channel. Useful for reading conversation context, checking what was discussed, or finding a specific message timestamp to react to or thread-reply into.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `channel` | string | Yes | Channel ID to fetch history from |
| `limit` | integer | No | Maximum number of messages to return. Defaults to 10, max 100 |
| `oldest` | string | No | Only return messages after this Unix timestamp (inclusive) |
| `latest` | string | No | Only return messages before this Unix timestamp (exclusive) |
| `token` | string | No | Slack bot token. Defaults to `TOOLPACK_SLACK_BOT_TOKEN` env var |

### `slack.conversations.replies`

Fetch all replies in a Slack thread. Use this to read the full conversation history of a thread, including who replied and when. Requires the channel ID and the timestamp (`ts`) of the parent message that started the thread.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `channel` | string | Yes | Channel ID that contains the thread |
| `ts` | string | Yes | Timestamp of the parent message that started the thread |
| `limit` | integer | No | Maximum number of replies to return. Defaults to 20, max 100 |
| `oldest` | string | No | Only return replies after this Unix timestamp (inclusive) |
| `latest` | string | No | Only return replies before this Unix timestamp (exclusive) |
| `token` | string | No | Slack bot token. Defaults to `TOOLPACK_SLACK_BOT_TOKEN` env var |

### `slack.auth.test`

Verify the bot token and retrieve the identity of the calling app. Returns the `bot_id`, `user_id`, `team`, and workspace URL. Use this when the `bot_id` is not configured and is needed for self-suppression or other identity checks.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `token` | string | No | Slack bot token. Defaults to `TOOLPACK_SLACK_BOT_TOKEN` env var |

## Examples

### Posting a Message

```typescript
const stream = toolpack.stream({
    messages: [{ role: 'user', content: 'Post "Deploy complete" to the #deployments channel' }],
    model: 'gpt-4o',
});
// AI uses slack.chat.postMessage
```

### Reading Channel History

```typescript
const stream = toolpack.stream({
    messages: [{ role: 'user', content: 'What were the last 5 messages in #general?' }],
    model: 'gpt-4o',
});
// AI uses slack.conversations.history
```

### Replying in a Thread

```typescript
const stream = toolpack.stream({
    messages: [{ role: 'user', content: 'Reply to the thread at ts 1234567890.123456 in #alerts' }],
    model: 'gpt-4o',
});
// AI uses slack.conversations.replies then slack.chat.postMessage with thread_ts
```

### Adding a Reaction

```typescript
const stream = toolpack.stream({
    messages: [{ role: 'user', content: 'Add a white_check_mark reaction to the latest message in #deployments' }],
    model: 'gpt-4o',
});
// AI uses slack.conversations.history then slack.reactions.add
```
