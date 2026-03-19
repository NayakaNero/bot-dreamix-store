// commands/fitur.js - Menampilkan semua fitur yang tersedia
const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'fitur',
    description: 'Menampilkan semua fitur yang tersedia di bot',
    
    async execute(message, args, client) {
        
        const embed = new EmbedBuilder()
            .setColor('#8d2dfb') // Merah maroon tema Dreamix
            .setTitle('📋 **DAFTAR FITUR BOT**')
            .setDescription(`
Halo <@${message.author.id}>! Berikut adalah fitur-fitur yang tersedia:

**👑 FITUR ADMIN:**
\`!admin\` - Manajemen admin (tambah/hapus/lihat admin)
\`!toko\` - Atur status toko buka/tutup
\`!ticket\` - Buat panel ticket
\`!embed\` - Buat embed kustom

**👤 FITUR UMUM:**
\`!qris\` - Lihat informasi pembayaran QRIS
\`!fitur\` - Menampilkan daftar fitur ini

**🎮 FITUR LAINNYA:**
*(Segera hadir)*
- Music player
- Game sederhana
- Welcome message
- Dan lainnya...

**📌 CARA PAKAI:**
Ketik \`!nama-fitur\` untuk menggunakan fitur tersebut.
Contoh: \`!qris\` untuk melihat info pembayaran.

**❓ BUTUH BANTUAN?**
Hubungi admin jika ada masalah atau pertanyaan.
            `)
            .setFooter({ text: `Dreamix Bot • ${message.guild?.name || 'Server'}` })
            .setTimestamp();

        // Kirim embed ke channel
        await message.channel.send({ embeds: [embed] });
        
        // Hapus pesan perintah !fitur agar chat bersih
        if (message.deletable) await message.delete();
    }
};