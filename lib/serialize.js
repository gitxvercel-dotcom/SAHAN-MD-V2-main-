/**
 * Simple message serializer for plugin handlers
 */
function serialize(m, sock) {
  if (!m) return m;

  const msg = m.message || {};
  const key = m.key || {};

  // body text extraction
  let body = '';
  if (msg.conversation) body = msg.conversation;
  else if (msg.extendedTextMessage?.text) body = msg.extendedTextMessage.text;
  else if (msg.imageMessage?.caption) body = msg.imageMessage.caption;
  else if (msg.videoMessage?.caption) body = msg.videoMessage.caption;
  else if (msg.buttonsResponseMessage?.selectedButtonId) body = msg.buttonsResponseMessage.selectedButtonId;
  else if (msg.listResponseMessage?.singleSelectReply?.selectedRowId) body = msg.listResponseMessage.singleSelectReply.selectedRowId;
  else if (msg.templateButtonReplyMessage?.selectedId) body = msg.templateButtonReplyMessage.selectedId;
  else if (msg.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson) {
    try {
      const p = JSON.parse(msg.interactiveResponseMessage.nativeFlowResponseMessage.paramsJson);
      body = p.id || p.selectedId || p.display_text || '';
    } catch (_) {}
  }

  const from = key.remoteJid || '';
  const isGroup = from.endsWith('@g.us');
  const sender = isGroup
    ? (key.participant || m.participant || from)
    : from;

  const pushName = m.pushName || 'User';

  return {
    ...m,
    body: body.trim(),
    from,
    sender,
    isGroup,
    pushName,
    isOwner: false, // set later
    quoted: msg.extendedTextMessage?.contextInfo?.quotedMessage
      ? { ...msg.extendedTextMessage.contextInfo }
      : null,
    reply: async (text, options = {}) => {
      return sock.sendMessage(from, { text, ...options }, { quoted: m });
    }
  };
}

module.exports = { serialize };
