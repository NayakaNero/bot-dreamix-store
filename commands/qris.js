// commands/qris.js - Informasi pembayaran QRIS (untuk semua user)
const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'qris',
    description: 'Menampilkan informasi pembayaran QRIS',
    
    async execute(message, args, client) {
        
        const embed = new EmbedBuilder()
            .setColor('#8d2dfb') // Merah maroon tema Dreamix
            .addFields(
                {
                    name: '💳 Payment Method',
                    value: 'Terima kasih telah memilih toko kami.\nSaat ini kami hanya menerima pembayaran melalui QRIS, yang mendukung:\n\n• 💙 DANA\n• 🟣 OVO\n• 💚 GoPay\n• 🧡 ShopeePay\n• 🏦 Mobile Banking (QRIS)',
                    inline: false
                },
                {
                    name: '📌 Catatan',
                    value: '• Pastikan nominal pembayaran sesuai dengan yang diberikan staff\n• 💾 Simpan bukti pembayaran setelah transaksi selesai\n• 🎫 Kirim bukti pembayaran ke ticket agar pesanan dapat diproses',
                    inline: false
                }
            )
            .setImage('https://cdn.discordapp.com/attachments/1483426646848700430/1483844785793011892/IMG-20260318-WA0059.jpg?ex=69bc11a5&is=69bac025&hm=4e312e8cface3d2a45a8fcc7a345c9cceeec74d1731f1a4c5078a3cf68a8c703&') // Menambahkan gambar QRIS
            .setFooter({ text: 'SATU QRIS UNTUK SEMUA.' });

        // Kirim embed ke channel
        await message.channel.send({ embeds: [embed] });
        
        // Hapus pesan perintah !qris agar chat bersih
        if (message.deletable) await message.delete();
    }
};