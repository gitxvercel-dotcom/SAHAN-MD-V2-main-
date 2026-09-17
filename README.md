# SAHAN-MD V2

Premium WhatsApp Multi-Device Bot with Button / Interactive Message support.

## How to use

1. Go to **SAHAN-MD V2 PAIR** site
2. Enter your number → Get Pair Code or QR
3. Login successfully → SESSION_ID comes to your **Self Chat**
   Example: `sᴀʜᴀɴ-ᴍᴅ~aawieh329e9aajaalal`
4. Paste that SESSION_ID into `config.js` → `SESSION_ID`
5. Deploy on Heroku / Railway / Koyeb / VPS

## Config

```js
SESSION_ID: "sᴀʜᴀɴ-ᴍᴅ~xxxxxxxx"
OWNER_NUMBER: "9477xxxxxxx"
PREFIX: "."
```

## Commands (starter)

- `.menu` / `.help`
- `.alive` / `.ping`
- `.owner`
- `.buttons` (demo)

## Notes

- This is a **starter template**. Add more plugins in `plugins/` folder.
- Buttons may be restricted by WhatsApp on some accounts. Interactive messages are preferred.
- Unofficial bots can get banned. Use at your own risk.
- For full mega session restore, expand the session loading logic.

## Deploy

### Heroku
- Add `SESSION_ID` and `OWNER_NUMBER` as Config Vars
- Deploy from GitHub

### Railway / Koyeb
- Same env vars

Made with ❤️ for SAHAN-MD V2
