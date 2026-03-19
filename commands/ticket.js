// commands/ticket.js - Sistem Ticket dengan 2 Tipe (Order di bawah chat, Bantuan di channel)
const { 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle,
    PermissionsBitField,
    ChannelType,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} = require('discord.js');

module.exports = {
    name: 'ticket',
    description: 'Sistem ticket untuk order dan bantuan',
    
    async execute(message, args, client) {
        // Cek permission admin
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply('❌ Hanya admin yang bisa menggunakan command ini!');
        }

        const embed = new EmbedBuilder()
            .setColor('#8d2dfb')
            .setTitle('🎫 **TICKET SYSTEM**')
            .setDescription(`
Silakan pilih tipe ticket yang Anda butuhkan:

**🛒 ORDER** - Untuk melakukan pemesanan produk
• Klik tombol ORDER untuk membuat ticket order
• Ticket akan muncul di **bawah chat** (thread)

**❓ BANTUAN** - Untuk pertanyaan atau bantuan
• Klik tombol BANTUAN untuk membuat ticket bantuan
• Ticket akan dibuat di **channel khusus** #ticket-bantuan
            `);

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

        await message.channel.send({ embeds: [embed], components: [row] });
        if (message.deletable) await message.delete();
    },

    async button(interaction, client) {
        const customId = interaction.customId;

        try {
            // ===== TICKET ORDER (THREAD/DI BAWAH CHAT) =====
            if (customId === 'ticket_order') {
                // Cek apakah sudah punya ticket order aktif
                const existingThread = interaction.channel.threads.cache.find(
                    t => t.name === `order-${interaction.user.username}` && !t.archived
                );

                if (existingThread) {
                    return interaction.reply({ 
                        content: `❌ Anda sudah memiliki ticket order aktif: ${existingThread}`, 
                        ephemeral: true 
                    });
                }

                // Buat thread (ticket di bawah chat)
                const thread = await interaction.channel.threads.create({
                    name: `order-${interaction.user.username}`,
                    autoArchiveDuration: 60,
                    type: ChannelType.PrivateThread,
                    reason: `Ticket order dari ${interaction.user.tag}`
                });

                // Add user ke thread
                await thread.members.add(interaction.user.id);

                // Embed untuk thread
                const threadEmbed = new EmbedBuilder()
                    .setColor('#00FF00')
                    .setTitle('🛒 **TICKET ORDER**')
                    .setDescription(`
Halo <@${interaction.user.id}>! 

Terima kasih telah membuat ticket order. Silakan jelaskan pesanan Anda di sini.

**📋 Informasi yang perlu disertakan:**
• Nama produk
• Jumlah
• Detail tambahan (jika ada)

Admin akan segera merespon pesanan Anda.
                    `)
                    .setTimestamp();

                await thread.send({ embeds: [threadEmbed] });

                await interaction.reply({ 
                    content: `✅ Ticket order berhasil dibuat! Cek di bawah chat: ${thread}`, 
                    ephemeral: true 
                });
            }

            // ===== TICKET BANTUAN (CHANNEL KHUSUS) =====
            else if (customId === 'ticket_bantuan') {
                // Cek apakah channel #ticket-bantuan sudah ada
                let ticketCategory = interaction.guild.channels.cache.find(
                    c => c.name === 'TICKET BANTUAN' && c.type === ChannelType.GuildCategory
                );

                // Buat kategori kalau belum ada
                if (!ticketCategory) {
                    ticketCategory = await interaction.guild.channels.create({
                        name: 'TICKET BANTUAN',
                        type: ChannelType.GuildCategory,
                        permissionOverwrites: [
                            {
                                id: interaction.guild.id,
                                deny: [PermissionsBitField.Flags.ViewChannel]
                            }
                        ]
                    });
                }

                // Cek apakah user sudah punya ticket bantuan aktif
                const existingChannel = interaction.guild.channels.cache.find(
                    c => c.name === `bantuan-${interaction.user.username}` && 
                         c.parentId === ticketCategory.id
                );

                if (existingChannel) {
                    return interaction.reply({ 
                        content: `❌ Anda sudah memiliki ticket bantuan aktif: ${existingChannel}`, 
                        ephemeral: true 
                    });
                }

                // Buat channel baru di bawah kategori
                const ticketChannel = await interaction.guild.channels.create({
                    name: `bantuan-${interaction.user.username}`,
                    type: ChannelType.GuildText,
                    parent: ticketCategory.id,
                    permissionOverwrites: [
                        {
                            id: interaction.guild.id,
                            deny: [PermissionsBitField.Flags.ViewChannel]
                        },
                        {
                            id: interaction.user.id,
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
                                PermissionsBitField.Flags.ReadMessageHistory
                            ]
                        }
                    ]
                });

                // Embed untuk channel bantuan
                const ticketEmbed = new EmbedBuilder()
                    .setColor('#0000FF')
                    .setTitle('❓ **TICKET BANTUAN**')
                    .setDescription(`
Halo <@${interaction.user.id}>! 

Selamat datang di ticket bantuan. Silakan tanyakan hal yang ingin Anda ketahui.

**📝 Tim kami akan dengan senang hati membantu Anda.**

Ketik pesan Anda di sini, admin akan segera merespon.
                    `)
                    .setTimestamp();

                await ticketChannel.send({ 
                    content: `<@${interaction.user.id}>`, 
                    embeds: [ticketEmbed] 
                });

                await interaction.reply({ 
                    content: `✅ Ticket bantuan berhasil dibuat! ${ticketChannel}`, 
                    ephemeral: true 
                });
            }

        } catch (error) {
            console.error('Ticket error:', error);
            await interaction.reply({ 
                content: '❌ Error: ' + error.message, 
                ephemeral: true 
            }).catch(() => {});
        }
    }
};
