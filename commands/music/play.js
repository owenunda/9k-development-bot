import { CreateEmbed } from '../../utils/functions.js';
import { SlashCommandBuilder } from 'discord.js';

export default {
    name: 'play',
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Play music in voice channel (Limited servers)')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('Song or video to search for')
                .setRequired(true)),
    aliases: ['!9k playdasdawdfafsfgsghrdzgdxgxcvxb'], // Original alias seems like a placeholder or specific trigger
    execute(msg, User, Bot) {
        return; // Original code returns immediately

        let Blocked = true;
        Bot.SongSys.AllowedServers.forEach(function (S) {
            if (S == msg.guild.id) {
                Blocked = false;
            }
        });
        if (Blocked) {
            const Embed = structuredClone(Bot.Embed);
            Embed.Title = "Error: 401";
            Embed.Description = `Currently music playlist are only supported in 9000inc's official server. Join to check it out!`;
            const embed = CreateEmbed(Embed);
            embed.addFields(
                { name: '9ks Server', value: Bot.ServerInvite });
            msg.channel.send({ embeds: [embed] });
            return;
        }
        let Server = false;
        const VC = msg.member.voice.channel;
        if (VC) { }
        else {
            const Embed = structuredClone(Bot.Embed);
            Embed.Title = "Join a voice channel.";
            Embed.Description = ``;
            msg.channel.send({ embeds: [CreateEmbed(Embed)] });
            return;
        }
        Bot.SongSys.Servers.forEach(function (S) {
            if (S.id == msg.guild.id) { Server = S }
        });

        if (Server) { }
        else {
            Server = {};
            Server.id = msg.guild.id;
            Server.VC = {};
            Server.VC.id = VC.id;
            Server.VC.Connection = false;
            Server.VC.Stream = false;
            Server.VC.Player = false;
            Server.Playlist = [];
            Server.Volume = 1;
            Server.Bass = 1;
            Server.Treble = 1;
            Server.Speed = 1;
            Server.Loop = false;
            Server.Paused = false;
        }
        let searchtext = msg.content.replace('!9k Play', '');
        searchtext = msg.content.replace('!9k play', '');
        Bot.YTS(searchtext).then(SearchRes => {
            const Videos = SearchRes.videos;
            searchtext = '';
            Videos.forEach(function (Video, ind) {
                searchtext += `**#${ind} ${Video.title}** - *(${Video.duration.timestamp})*
`;

            });
            const Embed = structuredClone(Bot.Embed);
            Embed.Title = "Video Search";
            Embed.Description = `**Enter a number from the list to add it to the song que!**

` + searchtext;
            msg.channel.send({ embeds: [CreateEmbed(Embed)] }).then(Sent => {
                const msg_filter = response => { return response.author.id === msg.author.id };
                Sent.channel.awaitMessages({ filter: msg_filter, max: 1 }).then((collected) => {
                    let VChoice = Math.floor(collected.first().content);
                    if (VChoice == 1 || VChoice == 2 || VChoice == 3 || VChoice == 4 || VChoice == 5 || VChoice == 6 || VChoice == 7 || VChoice == 8 || VChoice == 9 || VChoice == 10) { }
                    else { VChoice = 1 }

                    if (Server.VC.Connection) { }
                    else {
                        Server.VC.Connection = Bot.DVC.joinVoiceChannel({
                            channelId: VC.id,
                            guildId: msg.guild.id,
                            adapterCreator: msg.guild.voiceAdapterCreator,
                        });
                    }
                    Bot.SongSys.Servers.forEach(function (S) {
                        if (S.id == msg.guild.id) { Server = S }
                    });
                    Server.Playlist.push(Videos[VChoice].url);
                    if (Server.VC.Stream == false) {
                        Server.VC.Player = Bot.DVC.createAudioPlayer();



                        Server.VC.Stream = Bot.YTD(Videos[VChoice].url, {
                            filter: "audioonly",
                            opusEncoded: true,
                            encoderArgs: ['-af', 'bass=g=10,dynaudnorm=f=200']
                        });//, { filter: 'audioonly', opusEncoded: true, encoderArgs: ['-af', 'bass=g=10,dynaudnorm=f=200'] }).pipe(fs.createWriteStream("musicplayer.mp3"));
                        console.log(Server.VC.Stream);
                        Server.VC.Resource = Bot.DVC.createAudioResource(Server.VC.Stream, {
                            filter: "audioonly",
                            fmt: "mp3",
                            highWaterMark: 1 << 30,
                            liveBuffer: 20000,
                            dlChunkSize: 4096,
                            bitrate: 128,
                            quality: "lowestaudio",
                            inlineVolume: 0.3,
                        });
                        Server.VC.Connection.subscribe(Server.VC.Player);
                        Server.VC.Player.play(Server.VC.Resource);
                        Server.VC.Player.on('error', error => {
                            console.log('Error:' + error);
                            Server.VC.Player.stop();
                            Server.VC.Connection.destroy();
                            Server.VC.Stream.destroy();
                        });
                    }

                })

            })
        })
    }
}
