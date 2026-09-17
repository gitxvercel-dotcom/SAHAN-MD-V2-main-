import config from '../../config.js';

export default {
  command: ['owner', 'creator'],
  description: 'Show bot owner info',
  category: 'owner',

  async handler(sock, m) {
    const text = `*👑 Owner Info*\n\n` +
      `*Name:* ${config.OWNER_NAME}\n` +
      `*Number:* ${config.OWNER_NUMBER}\n` +
      `*Bot:* ${config.BOT_NAME}\n\n` +
      `> Contact owner for support / custom features`;

    try {
      const { Button } = await import('@vanzxy/baileys');
      await new Button(sock)
        .setTitle('Owner')
        .setBody(text)
        .setFooter('SAHAN-MD V2')
        .addCall('Call Owner', config.OWNER_NUMBER)
        .addReply('📋 Menu', '.menu')
        .send(m.from);
    } catch {
      await m.reply(text);
    }
  }
};
