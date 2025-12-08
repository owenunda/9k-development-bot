import { CreateEmbed, CompareDates } from '../../utils/functions.js';
import { ChartJSNodeCanvas } from 'chartjs-node-canvas';
import * as DateFNS from 'date-fns';
import DateDiff from 'date-diff';

export default {
    name: 'messages',
    aliases: ['!9k Messages All', '!9k Messages Max', '!9k Messages Minute', '!9k Messages Hour', '!9k Messages Daily', '!9k Messages Day', '!9k Messages Week', '!9k Messages Month', '!9k Messages Year',
        '!9k Server Messages All', '!9k Server Messages Max', '!9k Server Messages Hour', '!9k Server Messages Daily', '!9k Server Messages Day', '!9k Server Messages Minute', '!9k Server Messages Week', '!9k Server Messages Month', '!9k Server Messages Year'],
    execute(msg, User, Bot) {
        // Determine type and display based on msg.content or pass it as args
        let type = 'all';
        let display = 'default';
        const mtext = msg.content;

        if (mtext.includes('Server Messages')) {
            display = 'server';
        }

        if (mtext.includes('Minute')) { type = 'minutes' }
        else if (mtext.includes('Hour')) { type = 'hours' }
        else if (mtext.includes('Daily') || mtext.includes('Day')) { type = 'days' }
        else if (mtext.includes('Week')) { type = 'weeks' }
        else if (mtext.includes('Month')) { type = 'months' }
        else if (mtext.includes('Year')) { type = 'years' }
        else { type = 'all' }

        const DetailUsers = [];
        const DayMessages = [];
        let ServerMessages = 0;
        const TopUsers = [];
        let temptime = 1;
        const Embed = structuredClone(Bot.Embed);
        Embed.Title = 'How many ' + type + ' of messages?';
        Embed.Description = `Please enter how many ${type} of messages you would like to display. (Minimum 0.01 Maximum 360)`;
        msg.channel.send({ embeds: [CreateEmbed(Embed)] }).then(Sent => {
            const msg_filter = response => { return response.author.id === msg.author.id };
            Sent.channel.awaitMessages({ filter: msg_filter, max: 1 }).then((collected) => {
                temptime = parseFloat(collected.first().content);
                if (temptime <= 0.01 || temptime >= 360) { temptime = 1 }
                Bot.ServerMessages.forEach(function (Message) {//all messages oh boy
                    const Channel = msg.mentions.channels.first() || { id: Message.channelid };
                    if (Message.serverid == msg.guild.id) {//guild messages
                        if (Message.channelid == Channel.id) {//channel specific messages if found
                            if (type == 'all') {//all or compare dates / times hour day week month year?
                                DetailUsers.push(Message);
                                ServerMessages += 1;
                            }
                            else {
                                if (CompareDates(new Date(Message.senton), type, temptime)) {
                                    DetailUsers.push(Message);
                                    ServerMessages += 1;
                                }
                            }
                        }
                    }//DetailUsers has all the correct messages as individual objects
                });

                DetailUsers.forEach(function (Message) {

                    const Channel = msg.mentions.channels.first();
                    let TopUserFound = false;
                    let DayMessageFound = false;

                    DayMessages.forEach(function (DM) {
                        const daydiff = new DateDiff(new Date(Message.senton), new Date(DM.senton));
                        if (type == 'hours') {
                            if (daydiff.hours() <= 0.45) {//convert days to half hours
                                DM.count += 1;
                                DayMessageFound = true;
                            }
                        }
                        else if (type == 'minutes') {
                            if (daydiff.minutes() <= 0.45) {//convert days to half hours
                                DM.count += 1;
                                DayMessageFound = true;
                            }
                        }
                        else if (type == 'days') {
                            if (daydiff.days() <= 0.45) {//convert days to half hours
                                DM.count += 1;
                                DayMessageFound = true;
                            }
                        }
                        else if (type == 'months') {
                            if (daydiff.months() <= 0.45) {//convert days to half hours
                                DM.count += 1;
                                DayMessageFound = true;
                            }
                        }
                        else if (type == 'years') {
                            if (daydiff.years() <= 0.45) {
                                DM.count += 1;
                                DayMessageFound = true;
                            }
                        }
                    });
                    if (DayMessageFound == false) {//If we cant find a top user create one
                        const DM = Message;
                        DM.count = 1;
                        DayMessages.push(DM);
                    }

                    TopUsers.forEach(function (TUser) {
                        if (TUser.userid == Message.userid) {
                            TUser.count += 1;
                            TopUserFound = true;
                        }
                    });
                    if (TopUserFound == false) {//If we cant find a top user create one
                        const TUser = Message;
                        TUser.count = 1;
                        TopUsers.push(TUser);
                    }

                });//End DetailUsers forEach
                TopUsers.sort((a, b) => b.count - a.count);//sort TopUsers based on message count
                const TopUsersShort = TopUsers.slice(0, 9);
                const chartcolors = ['red', 'green', 'blue', 'orange', 'yellow', 'pink', 'purple'];//chart data setup
                const datalabels = [];
                const datasets = {};
                datasets.label = 'Messages';
                datasets.data = [];

                const Embed = structuredClone(Bot.Embed);//embed setup
                Embed.Title = msg.guild.name + " Top messages";
                Embed.Description = `**Server Messages: ${ServerMessages} **
`;
                Embed.Thumbnail = false;
                Embed.Image = false;
                let userranking = '';//user who sent msg rank

                if (display == 'default') {//display server message view vs user message view just dif ways building the data sets
                    TopUsers.forEach(function (TUser, ind) {
                        if (TUser.userid == msg.author.id) {
                            userranking = `

*Your Ranking: #${(ind + 1)}* **<@${TUser.userid}>** - *${TUser.count} Messages*`;
                        }


                        Bot.Client.users.fetch(TUser.userid).then(FUser => {
                            datasets.data.push(TUser.count);
                            datalabels.push(FUser.displayName);
                        }, Err => {
                            datasets.data.push(TUser.count);
                            datalabels.push(TUser.userid);
                        });//fetch users end

                    });//end of top users loop

                    setTimeout(function () {//wait for user fetch request need a better method for this
                        const chartscale = Math.max(1, TopUsers.Length / 50);
                        const chartwidth = 1280;//(1280 * chartscale)
                        const chartheight = 720;//(720 * chartscale)

                        Bot.ChartJS = new ChartJSNodeCanvas({ type: 'png', width: chartwidth, height: chartheight, backgroundColor: 'grey' });
                        TopUsersShort.forEach(function (TUser, ind) {
                            Embed.Description +=
                                `
*#${(ind + 1)}* **<@${TUser.userid}>** - ` + '*' + TUser.count + ' Messages*';
                        });
                        Embed.Description += userranking;//add the users ranking at the end of top ranked messages


                        const configuration = {//more chart config yay!// See https://www.chartjs.org/docs/latest/configuration
                            type: 'bar',
                            options: {
                                elements: {
                                    bar: {
                                        backgroundColor: '#8138ff',
                                        borderWidth: 5,
                                        borderColor: 'black',
                                        borderRadius: 15
                                    }
                                },
                                plugins: {
                                    legend: {
                                        labels: {
                                            color: 'white',
                                            font: {
                                                weight: 'bold',
                                                size: 65
                                            }
                                        }
                                    }
                                },
                                scales: {
                                    x: {
                                        ticks: {
                                            font: {
                                                size: 25,
                                                weight: 'bold',
                                            },
                                            color: 'white'
                                        }
                                    },
                                    y: {
                                        ticks: {
                                            font: {
                                                size: 25,
                                                weight: 'bold',
                                            },
                                            color: 'white'
                                        }
                                    }
                                }
                            },
                            data: { labels: datalabels, datasets: [datasets] }

                        };

                        Bot.ChartJS.renderToBuffer(configuration).then(image => {
                            msg.channel.send({ embeds: [CreateEmbed(Embed)], files: [{ attachment: image, name: msg.guild.name + " Top messages.png" }] });
                        })
                    }, 5500);//user fetch timeout

                }//end of default display
                else {
                    TopUsers.forEach(function (TUser, ind) {
                        if (TUser.userid == msg.author.id) {
                            userranking = `

*Your Ranking: #${(ind + 1)}* **<@${TUser.userid}>** - *${TUser.count} Messages*`;
                        }
                    });
                    console.log(DayMessages);
                    DayMessages.forEach(function (DM) {
                        datasets.data.push(DM.count);
                        datalabels.push(DateFNS.formatRelative(new Date(DM.senton), new Date()));
                    });


                    const chartscale = Math.max(1, TopUsers.Length / 50);
                    const chartwidth = 1280;//(1280 * chartscale)
                    const chartheight = 720;//(720 * chartscale)

                    Bot.ChartJS = new ChartJSNodeCanvas({ type: 'png', width: chartwidth, height: chartheight, backgroundColor: 'grey' });
                    TopUsersShort.forEach(function (TUser, ind) {
                        Embed.Description +=
                            `
*#${(ind + 1)}* **<@${TUser.userid}>** - ` + '*' + TUser.count + ' Messages*';
                    });
                    Embed.Description += userranking;//add the users ranking at the end of top ranked messages


                    const configuration = {//more chart config yay!// See https://www.chartjs.org/docs/latest/configuration
                        type: 'line',
                        options: {
                            elements: {
                                line: {
                                    backgroundColor: '#8138ff',
                                    borderWidth: 5,
                                    borderColor: '#8138ff',
                                }
                            },
                            plugins: {
                                legend: {
                                    labels: {
                                        color: 'white',
                                        font: {
                                            weight: 'bold',
                                            size: 65
                                        }
                                    }
                                }
                            },
                            scales: {
                                x: {
                                    ticks: {
                                        font: {
                                            size: 25,
                                            weight: 'bold',
                                        },
                                        color: 'white'
                                    }
                                },
                                y: {
                                    ticks: {
                                        font: {
                                            size: 25,
                                            weight: 'bold',
                                        },
                                        color: 'white'
                                    }
                                }
                            }
                        },
                        data: { labels: datalabels, datasets: [datasets] }

                    };

                    Bot.ChartJS.renderToBuffer(configuration).then(image => {
                        msg.channel.send({ embeds: [CreateEmbed(Embed)], files: [{ attachment: image, name: msg.guild.name + " Top messages.png" }] });
                    })



                }//alt display

            })
        })
    }
}
