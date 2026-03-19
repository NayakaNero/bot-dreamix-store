// commands/toko.js - Fitur Toko Buka/Tutup dengan pengaturan jam operasional
const { 
    EmbedBuilder, 
    PermissionsBitField
} = require('discord.js');
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data.json');

// Fungsi untuk membaca data
function readData() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const data = fs.readFileSync(DATA_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Gagal membaca data:', error);
    }
    return {
        tokoStatus: 'buka',
        jamOperasional: {
            'Senin-Jumat': '12.00 - 22.00',
            'Sabtu-Minggu': '08.00 - 23.00'
        }
    };
}

// Fungsi untuk menyimpan data
function saveData(data) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
        console.error('Gagal menyimpan data:', error);
    }
}

module.exports = {
    name: 'toko',
    description: 'Atur status toko buka/tutup dan jam operasional',
    
    async execute(message, args, client) {
        // Load data dari file
        const data = readData();
        
        // Update client dengan data dari file
        client.tokoStatus = data.tokoStatus;
        client.jamOperasional = data.jamOperasional;

        // Cek permission (hanya admin)
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply('❌ Hanya admin yang bisa menggunakan command ini!');
        }

        const subCommand = args[0]?.toLowerCase();

        // ===== TAMPILKAN STATUS TOKO =====
        if (!subCommand) {
            const status = client.tokoStatus || 'buka';
            const statusEmoji = status === 'buka' ? '🟢' : '🔴';
            
            const statusEmbed = new EmbedBuilder()
                .setColor(status === 'buka' ? '#00FF00' : '#FF0000')
                .setTitle('🏪 **STATUS TOKO**')
                .setDescription(`
${statusEmoji} Toko sedang **${status === 'buka' ? 'BUKA' : 'TUTUP'}**

**⏰ JAM OPERASIONAL:**
• Senin - Jumat: ${client.jamOperasional?.['Senin-Jumat'] || '12.00 - 22.00'}
• Sabtu - Minggu: ${client.jamOperasional?.['Sabtu-Minggu'] || '08.00 - 23.00'}

**📋 COMMAND:**
\`!toko buka\` - Buka toko
\`!toko tutup\` - Tutup toko
\`!toko jam\` - Lihat jam operasional
\`!toko setjam <senin_jumat> <sabtu_minggu>\` - Set jam operasional
\`!toko resetjam\` - Reset ke jam default
                `);

            return message.channel.send({ embeds: [statusEmbed] });
        }

        // ===== BUKA TOKO =====
        if (subCommand === 'buka') {
            client.tokoStatus = 'buka';
            client.tokoBukaSejak = Date.now();
            
            // Simpan ke file
            data.tokoStatus = 'buka';
            saveData(data);
            
            const bukaEmbed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('🟢 **TOKO DIBUKA**')
                .setDescription(`
Toko sekarang **BUKA**! 🎉

**⏰ JAM OPERASIONAL:**
• Senin - Jumat: ${client.jamOperasional?.['Senin-Jumat'] || '12.00 - 22.00'}
• Sabtu - Minggu: ${client.jamOperasional?.['Sabtu-Minggu'] || '08.00 - 23.00'}

**🛒 Selamat berbelanja!**
                `);

            await message.channel.send({ embeds: [bukaEmbed] });
            console.log(`🏪 Toko dibuka oleh ${message.author.tag}`);
            
            // Hapus command message
            if (message.deletable) await message.delete();
            
            return;
        }

        // ===== TUTUP TOKO =====
        if (subCommand === 'tutup') {
            client.tokoStatus = 'tutup';
            
            // Simpan ke file
            data.tokoStatus = 'tutup';
            saveData(data);
            
            const tutupEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('🔴 **TOKO DITUTUP**')
                .setDescription(`
Toko sekarang **TUTUP** 😴

**⏰ JAM OPERASIONAL:**
• Senin - Jumat: ${client.jamOperasional?.['Senin-Jumat'] || '12.00 - 22.00'}
• Sabtu - Minggu: ${client.jamOperasional?.['Sabtu-Minggu'] || '08.00 - 23.00'}

**📅 Silakan kembali esok hari!**
                `);

            await message.channel.send({ embeds: [tutupEmbed] });
            console.log(`🏪 Toko ditutup oleh ${message.author.tag}`);
            
            // Hapus command message
            if (message.deletable) await message.delete();
            
            return;
        }

        // ===== SET JAM OPERASIONAL =====
        if (subCommand === 'setjam') {
            // Cek apakah argumen cukup
            if (args.length < 3) {
                return message.reply('❌ Format salah! Gunakan: `!toko setjam <senin_jumat> <sabtu_minggu>`\nContoh: `!toko setjam 09.00-21.00 10.00-22.00`');
            }

            const jamWeekday = args[1]; // Senin-Jumat
            const jamWeekend = args[2]; // Sabtu-Minggu

            // Validasi format sederhana (harus mengandung angka dan tanda hubung)
            const timeRegex = /^[0-9]{2}\.[0-9]{2}-[0-9]{2}\.[0-9]{2}$/;
            
            if (!timeRegex.test(jamWeekday) || !timeRegex.test(jamWeekend)) {
                return message.reply('❌ Format jam salah! Gunakan format: `HH.MM-HH.MM`\nContoh: `09.00-21.00`');
            }

            // Simpan jam operasional baru
            client.jamOperasional = {
                'Senin-Jumat': jamWeekday,
                'Sabtu-Minggu': jamWeekend
            };
            
            // Simpan ke file
            data.jamOperasional = {
                'Senin-Jumat': jamWeekday,
                'Sabtu-Minggu': jamWeekend
            };
            saveData(data);

            const setJamEmbed = new EmbedBuilder()
                .setColor('#8B0000')
                .setTitle('⏰ **JAM OPERASIONAL DIUBAH**')
                .setDescription(`
Jam operasional telah diperbarui:

• **Senin - Jumat**: ${jamWeekday}
• **Sabtu - Minggu**: ${jamWeekend}

Gunakan \`!toko resetjam\` untuk kembali ke default.
                `);

            await message.channel.send({ embeds: [setJamEmbed] });
            console.log(`⏰ Jam operasional diubah oleh ${message.author.tag} menjadi: ${jamWeekday} dan ${jamWeekend}`);
            
            if (message.deletable) await message.delete();
            return;
        }

        // ===== RESET JAM OPERASIONAL =====
        if (subCommand === 'resetjam') {
            client.jamOperasional = {
                'Senin-Jumat': '12.00 - 22.00',
                'Sabtu-Minggu': '08.00 - 23.00'
            };
            
            // Simpan ke file
            data.jamOperasional = {
                'Senin-Jumat': '12.00 - 22.00',
                'Sabtu-Minggu': '08.00 - 23.00'
            };
            saveData(data);

            const resetEmbed = new EmbedBuilder()
                .setColor('#8B0000')
                .setTitle('⏰ **JAM OPERASIONAL RESET**')
                .setDescription(`
Jam operasional telah direset ke default:

• **Senin - Jumat**: 12.00 - 22.00
• **Sabtu - Minggu**: 08.00 - 23.00
                `);

            await message.channel.send({ embeds: [resetEmbed] });
            
            if (message.deletable) await message.delete();
            return;
        }

        // ===== LIHAT JAM OPERASIONAL =====
        if (subCommand === 'jam') {
            const jamEmbed = new EmbedBuilder()
                .setColor('#8B0000')
                .setTitle('⏰ **JAM OPERASIONAL**')
                .setDescription(`
• **Senin - Jumat**: ${client.jamOperasional?.['Senin-Jumat'] || '12.00 - 22.00'}
• **Sabtu - Minggu**: ${client.jamOperasional?.['Sabtu-Minggu'] || '08.00 - 23.00'}

**CARA UBAH JAM:**
Gunakan \`!toko setjam <senin_jumat> <sabtu_minggu>\`
Contoh: \`!toko setjam 09.00-21.00 10.00-22.00\`

Gunakan \`!toko resetjam\` untuk kembali ke default.
                `);

            return message.channel.send({ embeds: [jamEmbed] });
        }

        // ===== JIKA SUBCOMMAND TIDAK DIKENAL =====
        message.reply('❌ Command tidak dikenal! Gunakan `!toko` untuk melihat daftar command.');
    }
};