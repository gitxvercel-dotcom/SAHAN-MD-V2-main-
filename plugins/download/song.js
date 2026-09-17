import config from '../../config.js';

/**
 * Song / YouTube download plugin template
 * Add your yt-dlp / API logic inside handler
 */
export default {
  command: ['song', 'play', 'ytmp3'],
  alias: ['s'],
  description: 'Download song / YouTube audio',
  category: 'download',

  async handler(sock, m, { text, prefix }) {
    if (!text) {
      return m.reply(
        `*🎵 Usage:* ${prefix}song <song name or youtube link>\n\nExample:\n${prefix}song shape of you`
      );
    }

    await m.reply('⏳ *Searching...* Please wait');

    try {
      const query = text.trim();
      const isUrl = /youtu(\.be|be\.com)/i.test(query);

      const replyText =
        `*🎵 Song Request*\n\n` +
        `*Query:* ${query}\n` +
        `*Type:* ${isUrl ? 'YouTube Link' : 'Search'}\n\n` +
        `⚠️ *Note:* Full download needs yt-dlp / API key.\n` +
        `This is a plugin template. Add your downloader code here.`;

      try {
        const { Button } = await import('@vanzxy/baileys');
        await new Button(sock)
          .setTitle('Song Download')
          .setBody(replyText)
          .setFooter('SAHAN-MD V2 • Download')
          .addReply('📋 Menu', `${prefix}menu`)
          .addUrl(
            'YouTube',
            isUrl
              ? query
              : `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`
          )
          .send(m.from);
      } catch {
        await m.reply(replyText);
      }
    } catch (err) {
      console.error('song plugin error:', err);
      await m.reply('❌ Failed to process song request.\n' + (err.message || ''));
    }
  }
};
