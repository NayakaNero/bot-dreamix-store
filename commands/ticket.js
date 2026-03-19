// commands/ticket.js - FINAL FIX (Order = Thread, Bantuan = Channel)
const { 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle,
    ChannelType,
    PermissionsBitField
} = require('discord.js');

module.exports = {
    name: 'ticket',
    description: 'Membuat panel ticket bantuan & order',
    
    async execute(message, args, client) {
        
        // Cek permission (hanya admin yang bisa setup)
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply('❌ Hanya admin yang bisa menggunakan command ini!');
        }

        // Buat button ORDER (hijau) dan BANTUAN (biru) - IKON DIUBAH
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('ticket_order')
                    .setLabel('🛒 ORDER')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('ticket_bantuan')
                    .setLabel('❓ BANTUAN')
                    .setStyle(ButtonStyle.Primary)
            );

        // Buat embed panel ticket
        const ticketEmbed = new EmbedBuilder()
            .setColor('#8d2dfb')
            .setTitle('📋 **Help & Order**')
            .setDescription(`
Butuh bantuan atau ingin order sesuatu?

Klik tombol dibawah untuk membuat ticket:
- 🛒 **ORDER** - Untuk order (akan muncul di **bawah chat**)
- ❓ **BANTUAN** - Untuk bertanya (akan dibuat channel khusus)

**Support system**
            `)
            .setFooter({ text: `Ticket System • ${message.guild.name}` })
            .setTimestamp();

        // Kirim panel ticket
        await message.channel.send({ 
            embeds: [ticketEmbed], 
            components: [row] 
        });

        // Hapus command message
        if (message.deletable) await message.delete();
    },

    async button(interaction, client) {
        const customId = interaction.customId;

        try {
            // ===== TOMBOL ORDER (THREAD - DI BAWAH CHAT) =====
            if (customId === 'ticket_order') {
                await buatTicketOrder(interaction, client);
            }
            
            // ===== TOMBOL BANTUAN (CHANNEL) =====
            else if (customId === 'ticket_bantuan') {
                await buatTicketBantuan(interaction, client);
            }

            // ===== TOMBOL CLOSE TICKET =====
            else if (customId === 'ticket_close') {
                // Cek apakah ini channel ticket
                if (!interaction.channel.name.startsWith('ticket-') && !interaction.channel.name.startsWith('bantuan-')) {
                    return interaction.reply({ 
                        content: '❌ Ini bukan channel ticket!', 
                        ephemeral: true 
                    });
                }

                // Konfirmasi close
                const confirmEmbed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setDescription('Apakah kamu yakin ingin menutup ticket ini?');

                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('ticket_close_confirm')
                            .setLabel('✅ Ya, Tutup')
                            .setStyle(ButtonStyle.Danger),
                        new ButtonBuilder()
                            .setCustomId('ticket_close_cancel')
                            .setLabel('❌ Batal')
                            .setStyle(ButtonStyle.Secondary)
                    );

                await interaction.reply({ 
                    embeds: [confirmEmbed], 
                    components: [row], 
                    ephemeral: true 
                });
            }

            // ===== KONFIRMASI CLOSE =====
            else if (customId === 'ticket_close_confirm') {
                const channel = interaction.channel;
                
                // Langsung hapus channel tanpa pesan
                await channel.delete().catch(() => {});
            }

            // ===== BATAL CLOSE =====
            else if (customId === 'ticket_close_cancel') {
                await interaction.reply({ 
                    content: '✅ Penutupan ticket dibatalkan.', 
                    ephemeral: true 
                });
            }

            // ===== CLAIM TICKET =====
            else if (customId === 'ticket_claim') {
                // Cek apakah user adalah staff (punya permission manage channels)
                if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
                    return interaction.reply({ 
                        content: '❌ Hanya staff yang bisa claim ticket!', 
                        ephemeral: true 
                    });
                }

                const claimEmbed = new EmbedBuilder()
                    .setColor('#FFD700')
                    .setDescription(`📌 Ticket di-claim oleh **${interaction.user.tag}**`);

                await interaction.reply({ embeds: [claimEmbed] });
            }

        } catch (error) {
            console.error('Ticket button error:', error);
            
            // Kalau channel sudah dihapus, jangan kirim reply
            if (error.message.includes('Unknown Channel')) return;
            
            try {
                await interaction.reply({ 
                    content: '❌ Error: ' + error.message, 
                    ephemeral: true 
                }).catch(() => {});
            } catch (e) {}
        }
    }
};

// ===== FUNGSI MEMBUAT TICKET ORDER (THREAD - DI BAWAH CHAT) =====
async function buatTicketOrder(interaction, client) {
    try {
        const user = interaction.user;
        const channel = interaction.channel;

        // Cek apakah user sudah punya thread order aktif
        const existingThread = channel.threads.cache.find(
            t => t.name === `order-${user.username}` && !t.archived
        );

        if (existingThread) {
            return interaction.reply({ 
                content: `❌ Kamu sudah punya ticket order di ${existingThread}!`, 
                ephemeral: true 
            });
        }

        // Buat thread (ticket di bawah chat)
        const thread = await channel.threads.create({
            name: `order-${user.username}`,
            autoArchiveDuration: 1440, // 24 jam
            type: ChannelType.PrivateThread,
            reason: `Ticket order dari ${user.tag}`
        });

        // Add user ke thread
        await thread.members.add(user.id);

        // ===== CEK STATUS TOKO - HANYA KIRIM JIKA TUTUP =====
        const tokoCommand = client.commands.get('toko');
        
        if (tokoCommand) {
            const status = client.tokoStatus || 'tutup';
            
            // HANYA KIRIM PESAN KALAU TOKO TUTUP
            if (status === 'tutup') {
                const jamOperasional = client.jamOperasional || {
                    'Senin-Jumat': '12.00 - 22.00',
                    'Sabtu-Minggu': '08.00 - 23.00'
                };

                const sekarang = new Date();
                const hari = sekarang.toLocaleDateString('id-ID', { weekday: 'long' });
                let jamHariIni = '';

                if (hari.includes('Senin') || hari.includes('Selasa') || hari.includes('Rabu') || 
                    hari.includes('Kamis') || hari.includes('Jumat')) {
                    jamHariIni = jamOperasional['Senin-Jumat'] || '12.00 - 22.00';
                } else {
                    jamHariIni = jamOperasional['Sabtu-Minggu'] || '08.00 - 23.00';
                }

                const tutupEmbed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('🔴 **TOKO SEDANG TUTUP**')
                    .setDescription(`
Maaf, toko sedang tutup 😴

**⏰ JAM OPERASIONAL:**
${Object.entries(jamOperasional).map(([hari, jam]) => `• **${hari}**: ${jam}`).join('\n')}

**📅 Hari ini**: ${hari}
**⏱️ Jam buka**: ${jamHariIni}

Silakan kembali saat toko sudah buka.
Terima kasih! 🙏
                    `)
                    .setTimestamp();

                await thread.send({ embeds: [tutupEmbed] });
            }
            // KALAU TOKO BUKA, TIDAK ADA KODE APAPUN - TIDAK KIRIM PESAN
        }

        // Buat embed notifikasi ticket order
        const ticketEmbed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('🛒 **TICKET ORDER**')
            .setDescription(`
Halo <@${user.id}>! 

Terima kasih telah membuat ticket order. Silakan jelaskan pesanan Anda di sini.

**📋 Informasi yang perlu disertakan:**
• Nama produk
• Jumlah
• Detail tambahan (jika ada)

Admin akan segera merespon pesanan Anda.
            `)
            .setFooter({ text: 'Ticket Order | Klik 🔒 Close untuk menutup' })
            .setTimestamp();

        // Buat button actions
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('ticket_close')
                    .setLabel('🔒 Close Ticket')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('ticket_claim')
                    .setLabel('📌 Claim Ticket')
                    .setStyle(ButtonStyle.Primary)
            );

        // Kirim pesan utama ticket
        await thread.send({ 
            content: `<@${user.id}>`, 
            embeds: [ticketEmbed], 
            components: [row] 
        });

        // Kirim notifikasi ke user
        await interaction.reply({ 
            content: `✅ Ticket order berhasil dibuat! Cek di bawah chat: ${thread}`, 
            ephemeral: true 
        });

    } catch (error) {
        console.error('Buat ticket order error:', error);
        await interaction.reply({ 
            content: '❌ Gagal membuat ticket order: ' + error.message, 
            ephemeral: true 
        });
    }
}

// ===== FUNGSI MEMBUAT TICKET BANTUAN (CHANNEL) =====
async function buatTicketBantuan(interaction, client) {
    try {
        const user = interaction.user;
        const guild = interaction.guild;

        // Cek apakah user sudah punya ticket bantuan
        const existingChannel = guild.channels.cache.find(
            c => c.name === `bantuan-${user.username.toLowerCase()}`
        );

        if (existingChannel) {
            return interaction.reply({ 
                content: `❌ Kamu sudah punya ticket bantuan di ${existingChannel}!`, 
                ephemeral: true 
            });
        }

        // Cari category ticket bantuan
        let category = guild.channels.cache.find(c => 
            c.name === 'TICKET BANTUAN' && c.type === ChannelType.GuildCategory
        );

        // Buat category jika belum ada
        if (!category) {
            category = await guild.channels.create({
                name: 'TICKET BANTUAN',
                type: ChannelType.GuildCategory,
                permissionOverwrites: [
                    {
                        id: guild.id,
                        deny: [PermissionsBitField.Flags.ViewChannel]
                    }
                ]
            });
        }

        // Buat channel ticket baru
        const ticketChannel = await guild.channels.create({
            name: `bantuan-${user.username.toLowerCase()}`,
            type: ChannelType.GuildText,
            parent: category.id,
            permissionOverwrites: [
                {
                    id: guild.id,
                    deny: [PermissionsBitField.Flags.ViewChannel]
                },
                {
                    id: user.id,
                    allow: [
                        PermissionsBitField.Flags.ViewChannel,
                        PermissionsBitField.Flags.SendMessages,
                        PermissionsBitField.Flags.ReadMessageHistory
                    ]
                },
                {
                    id: client.user.id,
                    allow: [
                        PermissionsBitField.Flags.ViewChannel,
                        PermissionsBitField.Flags.SendMessages,
                        PermissionsBitField.Flags.ManageChannels
                    ]
                }
            ]
        });

        // Role staff yang bisa melihat ticket
        const staffRoles = ['Admin', 'Moderator', 'Support'];
        for (const roleName of staffRoles) {
            const role = guild.roles.cache.find(r => r.name === roleName);
            if (role) {
                await ticketChannel.permissionOverwrites.create(role, {
                    ViewChannel: true,
                    SendMessages: true,
                    ReadMessageHistory: true
                });
            }
        }

        // ===== CEK STATUS TOKO - HANYA KIRIM JIKA TUTUP =====
        const tokoCommand = client.commands.get('toko');
        
        if (tokoCommand) {
            const status = client.tokoStatus || 'tutup';
            
            // HANYA KIRIM PESAN KALAU TOKO TUTUP
            if (status === 'tutup') {
                const jamOperasional = client.jamOperasional || {
                    'Senin-Jumat': '12.00 - 22.00',
                    'Sabtu-Minggu': '08.00 - 23.00'
                };

                const sekarang = new Date();
                const hari = sekarang.toLocaleDateString('id-ID', { weekday: 'long' });
                let jamHariIni = '';

                if (hari.includes('Senin') || hari.includes('Selasa') || hari.includes('Rabu') || 
                    hari.includes('Kamis') || hari.includes('Jumat')) {
                    jamHariIni = jamOperasional['Senin-Jumat'] || '12.00 - 22.00';
                } else {
                    jamHariIni = jamOperasional['Sabtu-Minggu'] || '08.00 - 23.00';
                }

                const tutupEmbed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('🔴 **TOKO SEDANG TUTUP**')
                    .setDescription(`
Maaf, toko sedang tutup 😴

**⏰ JAM OPERASIONAL:**
${Object.entries(jamOperasional).map(([hari, jam]) => `• **${hari}**: ${jam}`).join('\n')}

**📅 Hari ini**: ${hari}
**⏱️ Jam buka**: ${jamHariIni}

Silakan kembali saat toko sudah buka.
Terima kasih! 🙏
                    `)
                    .setTimestamp();

                await ticketChannel.send({ embeds: [tutupEmbed] });
            }
            // KALAU TOKO BUKA, TIDAK ADA KODE APAPUN - TIDAK KIRIM PESAN
        }

        // Buat embed notifikasi ticket bantuan
        const ticketEmbed = new EmbedBuilder()
            .setColor('#0000FF')
            .setTitle('❓ **TICKET BANTUAN**')
            .setDescription(`
Halo <@${user.id}>! 

Selamat datang di ticket bantuan. Silakan tanyakan hal yang ingin Anda ketahui.

**📝 Tim kami akan dengan senang hati membantu Anda.**

Ketik pesan Anda di sini, admin akan segera merespon.
            `)
            .setFooter({ text: 'Ticket Bantuan | Klik 🔒 Close untuk menutup' })
            .setTimestamp();

        // Buat button actions
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('ticket_close')
                    .setLabel('🔒 Close Ticket')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('ticket_claim')
                    .setLabel('📌 Claim Ticket')
                    .setStyle(ButtonStyle.Primary)
            );

        // Kirim pesan utama ticket
        await ticketChannel.send({ 
            content: `<@${user.id}>`, 
            embeds: [ticketEmbed], 
            components: [row] 
        });

        // Kirim notifikasi ke user
        await interaction.reply({ 
            content: `✅ Ticket bantuan berhasil dibuat! ${ticketChannel}`, 
            ephemeral: true 
        });

    } catch (error) {
        console.error('Buat ticket bantuan error:', error);
        await interaction.reply({ 
            content: '❌ Gagal membuat ticket bantuan: ' + error.message, 
            ephemeral: true 
        });
    }
}
