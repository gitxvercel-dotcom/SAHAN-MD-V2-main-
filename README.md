# SAHAN-MD V2

Premium WhatsApp Multi-Device Bot  
**Baileys:** [`@vanzxy/baileys`](https://www.npmjs.com/package/@vanzxy/baileys)  
**Plugin System** • Native Flow Buttons • Pair Site compatible

---

## Requirements

- **Node.js 20+** (required by `@vanzxy/baileys`)
- Pair Site SESSION_ID or local `session/` folder

---

## Quick Start

```bash
npm install
# Edit config.js → OWNER_NUMBER + SESSION_ID (optional)
npm start
```

---

## Config (`config.js`)

```js
SESSION_ID: "",              // from Pair Site (optional if using local session)
OWNER_NUMBER: "9477xxxxxxx",
PREFIX: ".",
WORK_TYPE: "public",         // public | private | group
```

---

## Plugin Structure

```
plugins/
├── main/
│   ├── menu.js
│   └── alive.js
├── download/
│   └── song.js
└── owner/
    └── owner.js
```

### Plugin example

```js
// plugins/main/menu.js
module.exports = {
  command: ['menu', 'help'],
  alias: ['m'],
  description: 'Show menu',
  category: 'main',
  // ownerOnly: true,
  // groupOnly: true,
  async handler(sock, m, { args, text, prefix, categories }) {
    await m.reply('Hello!');
    // or use Button from @vanzxy/baileys
  }
};
```

Just drop a new `.js` file inside any folder under `plugins/` — it loads automatically on start.

---

## Built-in Commands

| Command     | Description              |
|-------------|--------------------------|
| `.menu`     | Main menu + buttons      |
| `.alive`    | Bot status / ping        |
| `.owner`    | Owner info               |
| `.song`     | Song download (template) |

---

## Buttons (@vanzxy/baileys)

```js
const { Button } = require('@vanzxy/baileys');

await new Button(sock)
  .setTitle('Title')
  .setBody('Body text')
  .setFooter('Footer')
  .addReply('Button Text', 'button_id')
  .addUrl('Open', 'https://example.com')
  .addCall('Call', '9477xxxxxxx')
  .send(jid);
```

Also available: `Poll`, `Carousel`, `AIRich`, etc.

---

## Deploy

Works on **Heroku / Railway / Koyeb / VPS**.

Set env vars:
- `SESSION_ID`
- `OWNER_NUMBER`

Node version must be **20+**.

---

## Notes

- `song.js` is a **template** — add your own YouTube / download API.
- Unofficial WhatsApp clients can lead to bans. Use at your own risk.
- Pair Site zip is separate (SAHAN-MD-V2-PAIR).

Made for **SAHAN-MD V2**
