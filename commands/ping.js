module.exports = {
    name: 'ping',
    description: 'Cek respons bot',
    aliases: ['pong'],
    cooldown: 5,
    
    execute(message, args, client, config) {
        const sent = Date.now();
        
        message.reply('🏓 Pinging...').then(msg => {
            const ping = Date.now() - sent;
            msg.edit(`🏓 Pong!\n📡 Bot ping: ${ping}ms\n💓 API ping: ${client.ws.ping}ms`);
        });
    }
};