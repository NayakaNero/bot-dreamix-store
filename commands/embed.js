// commands/embed.js - FIELD WITH BLACK BOX OPTION + JARAK AUTHOR DENGAN GAMBAR
const { 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle 
} = require('discord.js');

module.exports = {
    name: 'embed',
    description: 'Membuat embed dengan field dan box hitam',
    
    async execute(message, args, client) {
        
        // Buat session baru untuk user
        client.embedSessions = client.embedSessions || new Map();
        client.embedSessions.set(message.author.id, {
            judul: null,
            nama: null,
            deskripsi: null,
            warna: '#8d2dfb', // <-- DIUBAH JADI UNGU
            footer: null,
            gambar: null,
            thumbnail: null,
            author: null,
            authorIcon: null,
            fields: [] // [{ name: '...', value: '...', inline: false, useBox: false }]
        });

        // BUTTON ROWS
        const row1 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('embed_judul')
                    .setLabel('📝 Judul')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('embed_nama')
                    .setLabel('👤 Nama')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('embed_deskripsi')
                    .setLabel('📋 Deskripsi')
                    .setStyle(ButtonStyle.Primary)
            );

        const row2 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('embed_author')
                    .setLabel('👤 Author')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('embed_warna')
                    .setLabel('🎨 Warna')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('embed_gambar')
                    .setLabel('🖼️ Gambar')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('embed_thumbnail')
                    .setLabel('📸 Thumbnail')
                    .setStyle(ButtonStyle.Secondary)
            );

        const row3 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('embed_footer')
                    .setLabel('📌 Footer')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('embed_field_add')
                    .setLabel('➕ Tambah Field')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('embed_field_hapus')
                    .setLabel('➖ Hapus Field')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('embed_preview')
                    .setLabel('👀 Preview')
                    .setStyle(ButtonStyle.Primary)
            );

        const row4 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('embed_kirim')
                    .setLabel('📤 Kirim Embed')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('embed_reset')
                    .setLabel('🔄 Reset All')
                    .setStyle(ButtonStyle.Secondary)
            );

        // INFO EMBED
        const infoEmbed = new EmbedBuilder()
            .setColor('#8d2dfb') // <-- DIUBAH JADI UNGU
            .setTitle('🎨 **EMBED BUILDER - JARAK AUTHOR & GAMBAR**')
            .setDescription(`
Halo <@${message.author.id}>! 

**✨ FITUR AUTHOR DEFAULT:**
• Klik **👤 Author** sekali → otomatis aktif dengan:
  **Dreamix Store** + icon default
• Klik **👤 Author** lagi → author mati

**📝 CARA PAKAI:**
1. Klik **👤 Author** untuk toggle on/off
2. Isi judul, deskripsi, field seperti biasa
3. Preview untuk lihat hasil
4. Kirim!
            `);

        await message.channel.send({ 
            embeds: [infoEmbed], 
            components: [row1, row2, row3, row4] 
        });
        
        if (message.deletable) await message.delete();
    },

    async button(interaction, client) {
        const userId = interaction.user.id;
        client.embedSessions = client.embedSessions || new Map();
        let session = client.embedSessions.get(userId) || {
            judul: null,
            nama: null,
            deskripsi: null,
            warna: '#8d2dfb', // <-- DIUBAH JADI UNGU
            footer: null,
            gambar: null,
            thumbnail: null,
            author: null,
            authorIcon: null,
            fields: []
        };

        const customId = interaction.customId;

        try {
            // JUDUL BUTTON
            if (customId === 'embed_judul') {
                const modal = new ModalBuilder()
                    .setCustomId('modal_judul')
                    .setTitle('📝 Judul');

                const judulInput = new TextInputBuilder()
                    .setCustomId('judul')
                    .setLabel('Judul Embed')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('Contoh: 🛒 DREAMIX STORE')
                    .setRequired(false)
                    .setMaxLength(256)
                    .setValue(session.judul || '');

                const row = new ActionRowBuilder().addComponents(judulInput);
                modal.addComponents(row);
                await interaction.showModal(modal);
            }

            // NAMA BUTTON
            else if (customId === 'embed_nama') {
                const modal = new ModalBuilder()
                    .setCustomId('modal_nama')
                    .setTitle('👤 Nama');

                const namaInput = new TextInputBuilder()
                    .setCustomId('nama')
                    .setLabel('Nama (di bawah judul)')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('Contoh: dreamix_store')
                    .setRequired(false)
                    .setMaxLength(100)
                    .setValue(session.nama || '');

                const row = new ActionRowBuilder().addComponents(namaInput);
                modal.addComponents(row);
                await interaction.showModal(modal);
            }

            // DESKRIPSI BUTTON
            else if (customId === 'embed_deskripsi') {
                const modal = new ModalBuilder()
                    .setCustomId('modal_deskripsi')
                    .setTitle('📋 Deskripsi');

                const descInput = new TextInputBuilder()
                    .setCustomId('deskripsi')
                    .setLabel('Deskripsi')
                    .setStyle(TextInputStyle.Paragraph)
                    .setPlaceholder('Tulis deskripsi...')
                    .setRequired(false)
                    .setMaxLength(4000)
                    .setValue(session.deskripsi || '');

                const row = new ActionRowBuilder().addComponents(descInput);
                modal.addComponents(row);
                await interaction.showModal(modal);
            }

            // AUTHOR BUTTON - TOGGLE DEFAULT
            else if (customId === 'embed_author') {
                // Data default author
                const defaultAuthor = {
                    name: 'Dreamix Store',
                    iconURL: 'https://cdn.discordapp.com/attachments/1483426646848700430/1484246287439233265/Tak_berjudul254_20260311091948.jpg?ex=69bd8792&is=69bc3612&hm=1d66c294f57e7ec395e1ac5d9f8c249013f124bc05533aa73c68e568a8d58412&'
                };

                // Cek apakah author sudah aktif (menggunakan data default)
                if (session.author === defaultAuthor.name && session.authorIcon === defaultAuthor.iconURL) {
                    // Jika sudah aktif, matikan (set null)
                    session.author = null;
                    session.authorIcon = null;
                    client.embedSessions.set(userId, session);
                    await interaction.reply({ 
                        content: '❌ Author dimatikan.', 
                        ephemeral: true 
                    });
                } else {
                    // Jika belum aktif, aktifkan dengan data default
                    session.author = defaultAuthor.name;
                    session.authorIcon = defaultAuthor.iconURL;
                    client.embedSessions.set(userId, session);
                    await interaction.reply({ 
                        content: `✅ Author diaktifkan: **${defaultAuthor.name}**`, 
                        ephemeral: true 
                    });
                }
            }

            // WARNA BUTTON - INI YANG DIPANGGIL
            else if (customId === 'embed_warna') {
                const modal = new ModalBuilder()
                    .setCustomId('modal_warna')
                    .setTitle('🎨 Warna');

                const warnaInput = new TextInputBuilder()
                    .setCustomId('warna')
                    .setLabel('Warna (HEX atau nama)')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('#8d2dfb atau UNGU') // <-- UBAH PLACEHOLDER
                    .setRequired(false)
                    .setValue('#8d2dfb'); // <-- INI YANG DITAMPILIN DI MODAL (DEFAULT VALUE)

                const row = new ActionRowBuilder().addComponents(warnaInput);
                modal.addComponents(row);
                await interaction.showModal(modal);
            }

            // GAMBAR BUTTON
            else if (customId === 'embed_gambar') {
                const modal = new ModalBuilder()
                    .setCustomId('modal_gambar')
                    .setTitle('🖼️ Gambar');

                const gambarInput = new TextInputBuilder()
                    .setCustomId('gambar')
                    .setLabel('URL Gambar')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('https://...')
                    .setRequired(false)
                    .setValue(session.gambar || '');

                const row = new ActionRowBuilder().addComponents(gambarInput);
                modal.addComponents(row);
                await interaction.showModal(modal);
            }

            // THUMBNAIL BUTTON
            else if (customId === 'embed_thumbnail') {
                const modal = new ModalBuilder()
                    .setCustomId('modal_thumbnail')
                    .setTitle('📸 Thumbnail');

                const thumbInput = new TextInputBuilder()
                    .setCustomId('thumbnail')
                    .setLabel('URL Thumbnail')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('https://...')
                    .setRequired(false)
                    .setValue(session.thumbnail || '');

                const row = new ActionRowBuilder().addComponents(thumbInput);
                modal.addComponents(row);
                await interaction.showModal(modal);
            }

            // FOOTER BUTTON
            else if (customId === 'embed_footer') {
                const modal = new ModalBuilder()
                    .setCustomId('modal_footer')
                    .setTitle('📌 Footer');

                const footerInput = new TextInputBuilder()
                    .setCustomId('footer')
                    .setLabel('Teks Footer')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('Contoh: Free Simple Background')
                    .setRequired(false)
                    .setValue(session.footer || '');

                const row = new ActionRowBuilder().addComponents(footerInput);
                modal.addComponents(row);
                await interaction.showModal(modal);
            }

            // TAMBAH FIELD BUTTON
            else if (customId === 'embed_field_add') {
                const modal = new ModalBuilder()
                    .setCustomId('modal_field_add')
                    .setTitle('➕ Tambah Field');

                const fieldName = new TextInputBuilder()
                    .setCustomId('field_name')
                    .setLabel('📌 Nama Field')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('Contoh: Art Commission')
                    .setRequired(true)
                    .setMaxLength(256);

                const fieldValue = new TextInputBuilder()
                    .setCustomId('field_value')
                    .setLabel('📋 Isi Field')
                    .setStyle(TextInputStyle.Paragraph)
                    .setPlaceholder('Isi field...\nContoh:\n• Headshot: 30k\n• Half body: 40k\n• Full body: 50k')
                    .setRequired(true)
                    .setMaxLength(1024);

                const fieldType = new TextInputBuilder()
                    .setCustomId('field_type')
                    .setLabel('⬛ Tipe Field (default/box)')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('Ketik "box" untuk box hitam, atau "default"')
                    .setRequired(false)
                    .setMaxLength(10)
                    .setValue('default');

                const row1 = new ActionRowBuilder().addComponents(fieldName);
                const row2 = new ActionRowBuilder().addComponents(fieldValue);
                const row3 = new ActionRowBuilder().addComponents(fieldType);
                
                modal.addComponents(row1, row2, row3);
                await interaction.showModal(modal);
            }

            // HAPUS FIELD BUTTON
            else if (customId === 'embed_field_hapus') {
                if (session.fields && session.fields.length > 0) {
                    const removed = session.fields.pop();
                    client.embedSessions.set(userId, session);
                    await interaction.reply({ 
                        content: `✅ Field **"${removed.name}"** dihapus! Tersisa ${session.fields.length} field.`, 
                        ephemeral: true 
                    });
                } else {
                    await interaction.reply({ 
                        content: '❌ Tidak ada field untuk dihapus!', 
                        ephemeral: true 
                    });
                }
            }

            // PREVIEW BUTTON
            else if (customId === 'embed_preview') {
                let descriptionText = '';
                
                // Judul
                if (session.judul) {
                    descriptionText += `**${session.judul}**\n`;
                }
                
                // Nama
                if (session.nama) {
                    descriptionText += `*${session.nama}*\n`;
                }
                
                // Deskripsi
                if (session.deskripsi) {
                    descriptionText += session.deskripsi + '\n';
                }
                
                // Fields
                if (session.fields && session.fields.length > 0) {
                    for (const field of session.fields) {
                        if (field.useBox) {
                            descriptionText += `**${field.name}**\n\`\`\`\n${field.value}\n\`\`\`\n`;
                        } else {
                            descriptionText += `**${field.name}**\n${field.value}\n`;
                        }
                    }
                }

                const previewEmbed = new EmbedBuilder()
                    .setColor(session.warna)
                    .setDescription(descriptionText || '​');

                // AUTHOR
                if (session.author) {
                    if (session.authorIcon?.match(/^https?:\/\//)) {
                        previewEmbed.setAuthor({ 
                            name: session.author, 
                            iconURL: session.authorIcon 
                        });
                    } else {
                        previewEmbed.setAuthor({ name: session.author });
                    }
                }

                // GAMBAR - AKAN MUNCUL DI BAWAH DESCRIPTION
                if (session.gambar?.match(/^https?:\/\//)) {
                    previewEmbed.setImage(session.gambar);
                }

                if (session.thumbnail?.match(/^https?:\/\//)) {
                    previewEmbed.setThumbnail(session.thumbnail);
                }

                if (session.footer) {
                    previewEmbed.setFooter({ text: session.footer });
                }

                await interaction.reply({ 
                    embeds: [previewEmbed], 
                    ephemeral: true 
                });
            }

            // KIRIM BUTTON
            else if (customId === 'embed_kirim') {
                let descriptionText = '';
                
                // Judul
                if (session.judul) {
                    descriptionText += `**${session.judul}**\n`;
                }
                
                // Nama
                if (session.nama) {
                    descriptionText += `*${session.nama}*\n`;
                }
                
                // Deskripsi
                if (session.deskripsi) {
                    descriptionText += session.deskripsi + '\n';
                }
                
                // Fields
                if (session.fields && session.fields.length > 0) {
                    for (const field of session.fields) {
                        if (field.useBox) {
                            descriptionText += `**${field.name}**\n\`\`\`\n${field.value}\n\`\`\`\n`;
                        } else {
                            descriptionText += `**${field.name}**\n${field.value}\n`;
                        }
                    }
                }

                const finalEmbed = new EmbedBuilder()
                    .setColor(session.warna)
                    .setDescription(descriptionText || '​');

                // AUTHOR
                if (session.author) {
                    if (session.authorIcon?.match(/^https?:\/\//)) {
                        finalEmbed.setAuthor({ 
                            name: session.author, 
                            iconURL: session.authorIcon 
                        });
                    } else {
                        finalEmbed.setAuthor({ name: session.author });
                    }
                }

                // GAMBAR - AKAN MUNCUL DI BAWAH DESCRIPTION
                if (session.gambar?.match(/^https?:\/\//)) {
                    finalEmbed.setImage(session.gambar);
                }
                
                if (session.thumbnail?.match(/^https?:\/\//)) {
                    finalEmbed.setThumbnail(session.thumbnail);
                }
                
                if (session.footer) {
                    finalEmbed.setFooter({ text: session.footer });
                }

                // KIRIM TANPA CONTENT USER
                await interaction.channel.send({ 
                    embeds: [finalEmbed]
                });

                client.embedSessions.delete(userId);
                await interaction.reply({ 
                    content: '✅ Embed terkirim!', 
                    ephemeral: true 
                });
            }

            // RESET BUTTON
            else if (customId === 'embed_reset') {
                client.embedSessions.delete(userId);
                await interaction.reply({ 
                    content: '🔄 Session direset!', 
                    ephemeral: true 
                });
            }

        } catch (error) {
            console.error('Button error:', error);
            await interaction.reply({ 
                content: '❌ Error: ' + error.message, 
                ephemeral: true 
            }).catch(() => {});
        }
    },

    async modal(interaction, client) {
        const userId = interaction.user.id;
        let session = client.embedSessions.get(userId) || {
            judul: null,
            nama: null,
            deskripsi: null,
            warna: '#8d2dfb', // <-- DIUBAH JADI UNGU
            footer: null,
            gambar: null,
            thumbnail: null,
            author: null,
            authorIcon: null,
            fields: []
        };

        try {
            const modalId = interaction.customId;

            if (modalId === 'modal_judul') {
                session.judul = interaction.fields.getTextInputValue('judul');
            }
            else if (modalId === 'modal_nama') {
                session.nama = interaction.fields.getTextInputValue('nama');
            }
            else if (modalId === 'modal_deskripsi') {
                session.deskripsi = interaction.fields.getTextInputValue('deskripsi');
            }
            else if (modalId === 'modal_warna') {
                let warna = interaction.fields.getTextInputValue('warna') || '#8d2dfb'; // <-- DIUBAH JADI UNGU
                
                const warnaMap = {
                    'red': '#FF0000', 'blue': '#0000FF', 'green': '#00FF00',
                    'yellow': '#FFFF00', 'purple': '#800080', 'orange': '#FFA500',
                    'pink': '#FFC0CB', 'black': '#000000', 'white': '#FFFFFF',
                    'maroon': '#800000', 'gold': '#FFD700'
                };
                
                if (warnaMap[warna.toLowerCase()]) {
                    warna = warnaMap[warna.toLowerCase()];
                }
                
                session.warna = warna;
            }
            else if (modalId === 'modal_gambar') {
                session.gambar = interaction.fields.getTextInputValue('gambar');
            }
            else if (modalId === 'modal_thumbnail') {
                session.thumbnail = interaction.fields.getTextInputValue('thumbnail');
            }
            else if (modalId === 'modal_footer') {
                session.footer = interaction.fields.getTextInputValue('footer');
            }
            else if (modalId === 'modal_field_add') {
                if (!session.fields) session.fields = [];
                
                const fieldName = interaction.fields.getTextInputValue('field_name');
                const fieldValue = interaction.fields.getTextInputValue('field_value');
                const fieldType = interaction.fields.getTextInputValue('field_type')?.toLowerCase() || 'default';
                
                session.fields.push({
                    name: fieldName,
                    value: fieldValue,
                    useBox: fieldType === 'box'
                });
            }
            else if (modalId === 'modal_author') {
                // Tidak melakukan apa-apa, karena author sekarang pakai toggle
            }

            client.embedSessions.set(userId, session);
            
            let replyMessage = '';
            if (modalId === 'modal_field_add') {
                const boxCount = session.fields?.filter(f => f.useBox).length || 0;
                const defaultCount = session.fields?.length - boxCount || 0;
                replyMessage = `✅ Field ditambahkan! Total: ${session.fields?.length || 0} (${defaultCount} default, ${boxCount} box)`;
            } else {
                replyMessage = '✅ Berhasil disimpan!';
            }
            
            await interaction.reply({ 
                content: replyMessage, 
                ephemeral: true 
            });

        } catch (error) {
            console.error('Modal error:', error);
            await interaction.reply({ 
                content: '❌ Error: ' + error.message, 
                ephemeral: true 
            }).catch(() => {});
        }
    }
};
