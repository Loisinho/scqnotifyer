// Module loading.
const fs = require('fs');
const dotenv = require ('dotenv');
const http = require ('http');
const https = require ('https');
const express = require ('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const favicon = require('serve-favicon');
const telegraf = require ('telegraf');
const extra = require('telegraf/extra');
const markup = require('telegraf/markup');
const request = require('request');
const bodyParser = require('body-parser');
const path = require ('path');
const uniqueFilename = require ('unique-filename');
const engine = require('ejs-blocks');
const mongoose = require('mongoose');
const webRoutes = require('./routes/web.routes');
const nodemailer = require('nodemailer');

const {userschema, incidenceschema, municipalityschema} = require('./models/users.model');

const url = process.env.WEB_URL;
const email = process.env.WEB_EMAIL;

const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: email,
        pass: process.env.EMAIL_PASSWORD
    }
});


// Express module instance.
const app = express();


// View engine setup.
app.engine('ejs', engine);
app.set('view engine', 'ejs');
app.set('views',__dirname + '/views');
// favicon, public, css & js routes.
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/css', express.static(__dirname + '/node_modules/bootstrap/dist/css'));
app.use('/js', express.static(__dirname + '/node_modules/jquery/dist'));
app.use('/js', express.static(__dirname + '/node_modules/bootstrap/dist/js'));
// body-parser module.
app.use(bodyParser.urlencoded({ extended: true }));
// cookie-parser module.
app.use(cookieParser());

// express-session module (req.session).
app.use(session({
    secret: 'oursecret',
    resave: true,
    name: 'scqnotifyerCookie',
    saveUninitialized: true,
    cookie: {
        path: '/',
        maxAge: 1000 * 60 * 15, // 15 min
        sameSite: true,
        // secure: true, // only HTTPS.
    },
    rolling: true,
}));


// routes/web.routes.js
app.use('/', webRoutes);


// Environment file .env reading.
dotenv.config();


// HTTPS SSL Certs.
const privateKey = fs.readFileSync('./docs/certs/privkey.pem', 'utf8');
const certificate = fs.readFileSync('./docs/certs/cert.pem', 'utf8');
const ca = fs.readFileSync('./docs/certs/chain.pem', 'utf8');

const credentials = {
    key: privateKey,
    cert: certificate,
    ca: ca
};


const httpServer = http.createServer(credentials, app);
var server = httpServer.listen(process.env.WEB_HTTP_PORT, () => {
    console.log(`HTTP server running on port ${process.env.WEB_HTTP_PORT}`);
});

const httpsServer = https.createServer(credentials, app);
var server = httpsServer.listen(process.env.WEB_HTTPS_PORT, () => {
    console.log(`HTTPS server running on port ${process.env.WEB_HTTPS_PORT}`);
});


// Telegram BOT.
bot = new telegraf(process.env.BOT_TOKEN);
bot.telegram.setWebhook(process.env.WEBHOOK_URL + ':' + process.env.BOT_PORT + process.env.WEBHOOK_SECRET_FILE);
app.use(bot.webhookCallback(process.env.WEBHOOK_SECRET_FILE));

const botServer = https.createServer(credentials, app);
var server = botServer.listen(process.env.BOT_PORT, () => {
    console.log(`Bot server running on port ${process.env.BOT_PORT}`);
});


// mongoose module.
const mongoOptions = {
    keepAlive: 1,
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useFindAndModify: false
};

var mongoDB = 'mongodb://scqadmin:abc123.@127.0.0.1:27017/scqnotifyer';

// Main connection.
mongoose.connect(mongoDB, mongoOptions).catch(err => { console.log('Error connecting to MongoDB: ' + err)} );

mongoose.connection.on('error', err => {
    console.log('MongoDB connection error: ' + err);
});
mongoose.connection.on('connected', () => {
    console.log('Connected to MongoDB server.');
});


// BOT Commands:
// /start.
bot.start(ctx => {
    ctx.reply(`Welcome to SCQnotifyer!\nYou have to be signed up in\n${url}login`);
});

// /help.
bot.help(ctx => {
    ctx.reply('Use the /incidence command to start reporting an incidence.');
});

const buttons = {
    image: markup.callbackButton('Image', 'saveImage'),
    location: markup.callbackButton('Location', 'saveLocation'),
    description: markup.callbackButton('Description', 'saveDescription'),
    cancel: markup.callbackButton('Cancel', 'cancelReport')
};

function saveIncidence(ctx) {
    userschema.find({'telegram': ctx.chat.id}, (err, docs) => {
        if (docs.length != 0) {
            let btnsUpdate = [];
            if (docs[0].tg_img == '')
                btnsUpdate.push(buttons.image);
            if (docs[0].tg_coords == '')
                btnsUpdate.push(buttons.location);
            if (docs[0].tg_description == '')
                btnsUpdate.push(buttons.description);
            let keyboard = markup.inlineKeyboard([
                btnsUpdate,
                [buttons.cancel]
            ]);
            if (btnsUpdate.length == 0) {
                let url = `https://public.opendatasoft.com/api/records/1.0/search/?dataset=espana-municipios&facet=communidad_autonoma&facet=provincia&facet=municipio&refine.communidad_autonoma=Galicia&geofilter.distance=${docs[0].tg_coords.split(',')[0]}%2C+${docs[0].tg_coords.split(',')[1]}`;
                // console.log(url);
                request(url, function (err, response, body) {
                    if (err) {
                        bot.telegram.sendMessage(ctx.chat.id, 'The incidence has not been saved due to an error.');
                    } else {
                        let data = JSON.parse(body);
                        // console.log(data.records[0].fields);
                        let municipality = '';
                        if (data.records.length != 0)
                            municipality = data.records[0].fields.codigo_postal || data.records[0].fields.municipio;

                        let newIncidence = new incidenceschema({
                            img: docs[0].tg_img,
                            lat: docs[0].tg_coords.split(',')[0],
                            lon: docs[0].tg_coords.split(',')[1],
                            municipality: municipality,
                            description: docs[0].tg_description,
                        });
        
                        docs[0].incidences.push(newIncidence);
        
                        docs[0].save(err => {
                            if (err) {
                                bot.telegram.sendMessage(ctx.chat.id, 'The incidence has not been saved due to an error.');
                            } else {
                                bot.telegram.sendMessage(ctx.chat.id, 'The incidence has been saved successfully!');

                                municipalityschema.find({'ine': municipality}, (err, municipality) => {
                                    if (municipality.length != 0) {
                                        if (municipality[0].email != '') {
                                            let mailOptions = {
                                                from: email,
                                                to: municipality[0].email,
                                                subject: 'New incidence.',
                                                html: '<div style="text-align: center;"><h1 style="color: navy">' + municipality[0].name + ` has a new incidence.</h1><p>Following incidence has been notified:</p><br><a href="${url}map?inc=` + newIncidence._id + '" style="padding: 10px; background: navy; border-radius: 10px; color: #fff;">Incidence Link</a><br><br><p>Thanks,<br>SCQ Notifyer team.</p></div>'
                                            };
                                            transporter.sendMail(mailOptions, function(err, info) {
                                                if (err) {
                                                    console.log(err);
                                                } else {
                                                    console.log('Email sent: ' + info.response);
                                                }
                                            });
                                        }

                                        for (i in municipality[0].agents) {
                                            userschema.find({'telegram': municipality[0].agents[i]}, (err, agent) => {
                                                bot.telegram.sendMessage(municipality[0].agents[i], 'New incidence in ' + municipality[0].name + '.\nHi agent ' + agent[0].name + `,\nFollowing incidence has been notified:\n${url}map?inc=` + newIncidence._id);
                                                if (agent[0].email != '') {
                                                    let mailOptions = {
                                                        from: email,
                                                        to: agent[0].email,
                                                        subject: 'New incidence in ' + municipality[0].name + '.',
                                                        html: '<div style="text-align: center;"><h1 style="color: navy">New incidence in ' + municipality[0].name + '.</h1><p>Hi <b>agent ' + agent[0].name + `</b>,</p><p>Following incidence has been notified:</p><br><a href="${url}map?inc=` + newIncidence._id + '" style="padding: 10px; background: navy; border-radius: 10px; color: #fff;">Incidence Link</a><br><br><p>Message sent to ' + agent[0].email + '. If you do not want to receive this type of messages from SCQ Notifyer again, you can edit your profile or unsubscribe.</p><br><p>Thanks,<br>SCQ Notifyer team.</p></div>'
                                                    };
                                                    transporter.sendMail(mailOptions, function(err, info) {
                                                        if (err) {
                                                            console.log(err);
                                                        } else {
                                                            console.log('Email sent: ' + info.response);
                                                        }
                                                    });
                                                }
                                            });
                                        }
                                    }
                                });
                            }
                        });
                    }
                    docs[0].tg_command = '';
                    docs[0].tg_img = '';
                    docs[0].tg_coords = '';
                    docs[0].tg_description = '';
                });
            } else {
                let capital = docs[0].tg_command.substring(0, 1).toUpperCase();
                let lower = docs[0].tg_command.substring(1);
                bot.telegram.sendMessage(ctx.chat.id, capital + lower + " received, next:", extra.markup(keyboard));
            }
        } else {
            bot.telegram.sendMessage(ctx.chat.id, `You have to be signed up in\n${url}login`);
        }
    });
}

// /incidence.
bot.command('incidence', ctx => {
    userschema.find({'telegram': ctx.chat.id}, (err, docs) => {
        if (docs.length != 0) {
            if (docs[0].tg_command == '') {
                let keyboard = markup.inlineKeyboard([
                    [buttons.image, buttons.location, buttons.description],
                    [buttons.cancel]
                ]);
                docs[0].tg_command = 'incidence';
                docs[0].save(err => {
                    if (err)
                        bot.telegram.sendMessage(ctx.chat.id, 'An error has occurred.');
                    else
                        bot.telegram.sendMessage(ctx.chat.id, 'Use the keyboard below to send everything needed for the incidence.', extra.markup(keyboard));
                });
            } else {
                bot.telegram.sendMessage(ctx.chat.id, 'There is another active process.\nYou have to cancel it previously.');
            }
        } else {
            bot.telegram.sendMessage(ctx.chat.id, `You have to be signed up in\n${url}login`);
        }
    });
});

// /cancel.
bot.command('cancel', ctx => {
    userschema.find({'telegram': ctx.chat.id}, (err, docs) => {
        if (docs.length != 0) {
            if (docs[0].tg_command != '') {
                if (docs[0].tg_img != '')
                    fs.unlink('./public/img/' + docs[0].tg_img, (err) => {
                        if (err)
                            console.log('Error unlinking the img: ' + err);
                    });
                docs[0].tg_command = '';
                docs[0].tg_img = '';
                docs[0].tg_coords = '';
                docs[0].tg_description = '';
                docs[0].save(err => {
                    if (err)
                        bot.telegram.sendMessage(ctx.chat.id, 'An error has occurred.');
                    else
                        bot.telegram.sendMessage(ctx.chat.id, 'The process has been cancelled.');
                });
            } else {
                bot.telegram.sendMessage(ctx.chat.id, 'There is not an active process.');
            }
        } else {
            bot.telegram.sendMessage(ctx.chat.id, `You have to be signed up in\n${url}login`);
        }
    });
});

bot.action('cancelReport', ctx => {
    ctx.deleteMessage();
    userschema.find({'telegram': ctx.chat.id}, (err, docs) => {
        if (docs.length != 0) {
            if (docs[0].tg_command != '') {
                if (docs[0].tg_img != '')
                    fs.unlink('./public/img/' + docs[0].tg_img, (err) => {
                        if (err)
                            console.log('Error unlinking the img: ' + err);
                    });
                docs[0].tg_command = '';
                docs[0].tg_img = '';
                docs[0].tg_coords = '';
                docs[0].tg_description = '';
                docs[0].save(err => {
                    if (err)
                        bot.telegram.sendMessage(ctx.chat.id, 'An error has occurred.');
                    else
                        bot.telegram.sendMessage(ctx.chat.id, 'The incidence process has been cancelled.');
                });
            } else {
                bot.telegram.sendMessage(ctx.chat.id, 'The incidence process was already cancelled.');
            }
        } else {
            bot.telegram.sendMessage(ctx.chat.id, `You have to be signed up in\n${url}login`);
        }
    });
});

bot.action('saveImage', ctx => {
    ctx.deleteMessage();
    userschema.find({'telegram': ctx.chat.id}, (err, docs) => {
        if (docs.length != 0) {
            if (docs[0].tg_command != '') {
                docs[0].tg_command = 'image';
                docs[0].save(err => {
                    if (err)
                        bot.telegram.sendMessage(ctx.chat.id, 'An error has occurred.');
                    else
                        bot.telegram.sendMessage(ctx.chat.id, 'Send me the image.');
                });
            } else {
                bot.telegram.sendMessage(ctx.chat.id, 'There is not an active process.');
            }
        } else {
            bot.telegram.sendMessage(ctx.chat.id, `You have to be signed up in\n${url}login`);
        }
    });
});

bot.on('photo', ctx => {
    userschema.find({'telegram': ctx.chat.id}, (err, docs) => {
        if (docs.length != 0) {
            if (docs[0].tg_command == 'image') {
                let imgFile = `https://api.telegram.org/bot${process.env.BOT_TOKEN}/getFile?file_id=${ctx.message.photo[ctx.message.photo.length-1].file_id}`;
                request(imgFile, function(err, res, body) {
                    body = JSON.parse(body);
                    let urlDownloadFile = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${body.result.file_path}`;
                    let finalImgName = uniqueFilename('', ctx.from.id) + '.' + body.result.file_path.split('.').pop();
                    request(urlDownloadFile).pipe(fs.createWriteStream('./public/img/' + finalImgName));
                    docs[0].tg_img = finalImgName;
                    docs[0].save(err => {
                        if (err)
                            bot.telegram.sendMessage(ctx.chat.id, 'An error has occurred.');
                        else
                            saveIncidence(ctx);
                    });
                });
            } else {
                bot.telegram.sendMessage(ctx.chat.id, "It is not the time for an image...");
            }
        } else {
            bot.telegram.sendMessage(ctx.chat.id, `You have to be signed up in\n${url}login`);
        }
    });
});

bot.action('saveLocation', ctx => {
    ctx.deleteMessage();
    userschema.find({'telegram': ctx.chat.id}, (err, docs) => {
        if (docs.length != 0) {
            if (docs[0].tg_command != '') {
                docs[0].tg_command = 'location';
                docs[0].save(err => {
                    if (err)
                        bot.telegram.sendMessage(ctx.chat.id, 'An error has occurred.');
                    else
                        bot.telegram.sendMessage(ctx.chat.id, 'Send me the location.');
                });
            } else {
                bot.telegram.sendMessage(ctx.chat.id, 'There is not an active process.');
            }
        } else {
            bot.telegram.sendMessage(ctx.chat.id, `You have to be signed up in\n${url}login`);
        }
    });
});

bot.on('location', ctx => {
    userschema.find({'telegram': ctx.chat.id}, (err, docs) => {
        if (docs.length != 0) {
            if (docs[0].tg_command == 'location') {
                docs[0].tg_coords = ctx.message.location.latitude + ',' + ctx.message.location.longitude;
                docs[0].save(err => {
                    if (err)
                        bot.telegram.sendMessage(ctx.chat.id, 'An error has occurred.');
                    else
                        saveIncidence(ctx);
                });
            } else {
                bot.telegram.sendMessage(ctx.chat.id, "It is not the time for a location...");
            }
        } else {
            bot.telegram.sendMessage(ctx.chat.id, `You have to be signed up in\n${url}login`);
        }
    });
});

bot.action('saveDescription', ctx => {
    ctx.deleteMessage();
    userschema.find({'telegram': ctx.chat.id}, (err, docs) => {
        if (docs.length != 0) {
            if (docs[0].tg_command != '') {
                docs[0].tg_command = 'description';
                docs[0].save(err => {
                    if (err)
                        bot.telegram.sendMessage(ctx.chat.id, 'An error has occurred.');
                    else
                        bot.telegram.sendMessage(ctx.chat.id, 'Send me the descriptive text.');
                });
            } else {
                bot.telegram.sendMessage(ctx.chat.id, 'There is not an active process.');
            }
        } else {
            bot.telegram.sendMessage(ctx.chat.id, `You have to be signed up in\n${url}login`);
        }
    });
});

// /agentregister.
bot.command('agentregister', ctx => {
    userschema.find({'telegram': ctx.chat.id}, (err, docs) => {
        if (docs.length != 0) {
            if (docs[0].agent == '') {
                if (docs[0].tg_command == '') {
                    docs[0].tg_command = 'municipality';
                    docs[0].save(err => {
                        if (err)
                            bot.telegram.sendMessage(ctx.chat.id, 'An error has occurred.');
                        else
                            bot.telegram.sendMessage(ctx.chat.id, 'Send me the municipality.');
                    });
                } else {
                    bot.telegram.sendMessage(ctx.chat.id, 'There is another active process.\nYou have to cancel it previously.');
                }
            } else  {
                bot.telegram.sendMessage(ctx.chat.id, 'You are already an agent in ' + docs[0].agent + '.');
            }
        } else {
            bot.telegram.sendMessage(ctx.chat.id, `You have to be signed up in\n${url}login`);
        }
    });
});

bot.on('text', ctx => {
    userschema.find({'telegram': ctx.chat.id}, (err, user) => {
        if (user.length != 0) {
            if (user[0].tg_command == 'description') {
                user[0].tg_description = ctx.message.text.substring(0, 255);
                user[0].save(err => {
                    if (err)
                        bot.telegram.sendMessage(ctx.chat.id, 'An error has occurred.');
                    else {
                        ctx.deleteMessage();
                        saveIncidence(ctx);
                    }
                });
            } else if (user[0].tg_command == 'municipality') {
                municipalityschema.find({'ine': ctx.message.text}, (err, municipality) => {
                    if (municipality.length != 0) {
                        user[0].tg_command = 'code';
                        user[0].tg_municipality = municipality[0].ine;
                        user[0].save(err => {
                            if (err)
                                bot.telegram.sendMessage(ctx.chat.id, 'An error has occurred.');
                            else
                                bot.telegram.sendMessage(ctx.chat.id, "Ok, now send me the " + municipality[0].name + " register code.");
                        });
                    } else {
                        bot.telegram.sendMessage(ctx.chat.id, "Wrong municipality.");
                    }
                });
            } else if (user[0].tg_command == 'code') {
                municipalityschema.find({'ine': user[0].tg_municipality}, (err, municipality) => {
                    if (municipality.length != 0) {
                        if (municipality[0].registerCode == ctx.message.text) {
                            user[0].agent = user[0].tg_municipality;
                            user[0].tg_command = '';
                            user[0].tg_municipality = '';
                            municipality[0].agents.push(user[0].telegram);
                            municipality[0].save(err => {
                                if (err) bot.telegram.sendMessage(ctx.chat.id, 'An error has occurred.');
                            });
                            user[0].save(err => {
                                if (err)
                                    bot.telegram.sendMessage(ctx.chat.id, 'An error has occurred.');
                                else
                                    bot.telegram.sendMessage(ctx.chat.id, 'Agent saved successfully.');
                            });
                        } else {
                            bot.telegram.sendMessage(ctx.chat.id, 'Wrong register code.');
                        }
                    } else {
                        bot.telegram.sendMessage(ctx.chat.id, 'The municipality does not exists.');
                    }
                });
            } else {
                bot.telegram.sendMessage(ctx.chat.id, 'It is not the time for a text...');
            }
        } else {
            bot.telegram.sendMessage(ctx.chat.id, `You have to be signed up in\n${url}login`);
        }
    });
});
