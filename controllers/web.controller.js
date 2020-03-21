const fs = require('fs');
const request = require('request');

const {userschema, municipalityschema} = require('../models/users.model');

// TODO: Modify before use.
const url = '';
const email = '';

const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: email,
        pass: 'password' // TODO: Modify before use.
    }
});

// XSS-safe function.
function escapeInput(input) {
    return String(input)
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

//////////////////////////////////////////////////////////////
///// PUBLIC FUNCTIONS ///////////////////////////////////////
//////////////////////////////////////////////////////////////

// GET tests, /tests.
exports.web_test = function (req, res, next) {
    res.render('tests',{title: 'SCQN - Tests'});
};


// GET Root.
exports.web_root = function (req, res, next) {
    res.render('index', {title: "SCQN - Main Page"});
};


// GET Info, left menu.
exports.web_info = function (req, res, next) {
    res.render('info', {title: "SCQN - Info"});
};


// GET Incidences, left menu.
exports.web_incidences = function (req, res, next) {
    userschema.find({}, function(err, docs) {
        if (docs.length != 0) {
            let incidences = [];
            for (i in docs){
                incidences = incidences.concat(docs[i].incidences);
            }
            incidences.sort(function compare(a, b) {
                let dateA = new Date(a.date);
                let dateB = new Date(b.date);
                return dateB - dateA;
            });
            res.render('incidences', {title: "SCQN - Incidences", incidences: incidences.splice(0, 10)});
        } else {
            res.render('incidences', {title: "SCQN - Incidences", incidences: []});
        }
    });
};


// GET Municipalities, left menu.
exports.web_municipalities = function (req, res, next) {
    municipalityschema.find({}, function(err, docs) {
        if (docs.length != 0) {
            docs.sort(function(a, b){return a.name.localeCompare(b.name)});
            res.render('municipalities', {title: "SCQN - Municipalities", municipalities: docs});
        } else {
            res.render('municipalities', {title: "SCQN - Municipalities", municipalities: []});
        }
    });
}


// GET Municipalities, left menu.
exports.web_getmunicipalityincidences = function (req, res, next) {
    municipalityschema.find({ine: req.query.municipality}, function(err, docs) {
        if (docs.length != 0) {
            let info = docs[0];
            userschema.find({}, function(err, docs) {
                if (docs.length != 0) {
                    let data = [];
                    for (i in docs)
                        for (j in docs[i].incidences)
                            if (docs[i].incidences[j].municipality == req.query.municipality)
                                data.push(docs[i].incidences[j]);

                    res.send({status: 'ok', info: info, data: data});
                } else {
                    res.send({status: 'ok', info: info, data: []});
                }
            });
        } else {
            res.send({status: 'error', data: 'Municipality not found, please try again.'});
        }
    });
}


// GET Map, left menu & Incidences see on map.
exports.web_map = function (req, res, next) {
    if (req.query.inc) {
        userschema.find({}, function(err, docs) {
            if (docs.length != 0) {
                for (i in docs)
                    for (j in docs[i].incidences)
                        if (docs[i].incidences[j]._id == req.query.inc)
                            res.render('map', {title: "SCQN - Mapa", incidences: docs[i].incidences[j]});
            } else {
                res.render('map', {title: "SCQN - Mapa", incidences: []});
            }
        });
    } else {
        userschema.find({}, function(err, docs) {
            if (docs.length != 0) {
                let incidences = [];
                for (i in docs)
                    // incidences = incidences.concat(docs[i].incidences);
                    for (j in docs[i].incidences)
                        if (!docs[i].incidences[j].solved)
                            incidences.push(docs[i].incidences[j]);
                incidences.sort(function compare(a, b) {
                    let dateA = new Date(a.date);
                    let dateB = new Date(b.date);
                    return dateB - dateA;
                });
                res.render('map', {title: "SCQN - Mapa", incidences: incidences.splice(0, 10)});
            } else {
                res.render('map', {title: "SCQN - Mapa", incidences: []});
            }
        });
    }
};


// GET Meteo, left menu.
exports.web_meteo = function (req, res, next) {
    res.render('meteo', {title: "SCQN - Meteo"});
};


// GET Get Meteo, meteo view.
exports.web_showmeteo = function (req, res, next) {
    let url = `http://api.openweathermap.org/data/2.5/weather?q=${escapeInput(req.query.city)}&appid=${process.env.METEO_TOKEN}&units=metric`;
    request(url, function (err, response, body) {
        if (err) {
            res.send({status: 'error', info: 'An Error occurred, please try again.'});
        } else {
            let info = JSON.parse(body);
            if (info.main == undefined)
                res.send({status: 'error', info: 'City not found, please try again.'});
            else
                res.send({status: 'ok', info: info});
        }
    });
}


// GET Login, left menu.
exports.web_login = function (req, res, next) {
    res.render('login', {title: "SCQN - Login"});
}


// POST Loginx, Telegram authenzication.
exports.web_loginx = function (req, res, next) {
    session = req.session;
    
    session.user = {};
    session.user.id = req.body.id;
    session.user.name = req.body.first_name;
    if ('last_name' in req.body)
        session.user.lastname = req.body.last_name;
    else
        session.user.lastname = '';
    session.user.username = req.body.username;

    userschema.find({telegram: req.body.id}, function(err, docs) {
        if (err) {
            res.send({status: "error", data: err});
        } else {
            if (!docs.length) {
                let newUser = new userschema({
                    name: req.body.first_name,
                    lastname: session.user.lastname,
                    username: req.body.username,
                    telegram: req.body.id,
                });
        
                newUser.save(function(err) {
                    if (err)
                        res.type('json').status(422).send({ status: "error", data: err });
                    else
                        res.type('json').status(200).send({ status: "ok", data: "User signed up & logged in successfully!" });
                });

                session.user.agent = '';
                session.user.notify = true;
            } else {
                session.user.name = docs[0].name;
                session.user.lastname = docs[0].lastname;
                session.user.email = docs[0].email;
                session.user.username = docs[0].username;
                session.user.agent = docs[0].agent;
                session.user.notify = docs[0].notify;

                res.type('json').status(200).send({ status: "ok", data: "User logged in successfully!" });
            }
        }
    });
}


//////////////////////////////////////////////////////////////
///// PRIVATE FUNCTIONS //////////////////////////////////////
//////////////////////////////////////////////////////////////

// GET Disconnect, upper menu & left menu.
exports.web_disconnect = function (req, res, next) {
    req.session.destroy(function(err) {
        if (err)
            res.end('Session destroying error.');
        else {
            // Send redirect.
            res.writeHead(307, {Location: '/'});
            res.end();
        }
    });
}


// GET Profile, left menu.
exports.web_profile = function (req, res, next) {
    res.render('profile', {title: "SCQN - Profile"});
}


// POST Update profile, profile.
exports.web_update_profile = async function(req, res, next) {
    session = req.session;

    let data = {
        name: escapeInput(req.body.name),
        lastname: escapeInput(req.body.lastname),
        email: escapeInput(req.body.email),
        notify: req.body.notify
    }

    userschema.updateOne({telegram: session.user.id}, {name: data.name, lastname: data.lastname, email: data.email, notify: data.notify}, function(err, docs) {
        if (err)
            res.type('json').status(422).send({ status: "error", data: err });
        else {
            session.user.name = req.body.name;
            session.user.lastname = req.body.lastname;
            session.user.email = req.body.email;
            session.user.notify = (req.body.notify == 'true');

            res.type('json').status(200).send({status: "ok", data: session.user});
        }
    });
}


// GET Delete account, profile.
exports.web_delete_account = function(req, res, next) {
    session = req.session;

    userschema.deleteOne({telegram: session.user.id}, function(err, docs) {
        if (err) {
            res.type("json").status(422)({status: "error", data: err});
        } else {
            if (docs) {
                fs.readdir("./public/img", function(err, files) {
                    for (f in files)
                        if (files[f].split('-')[0] == session.user.id)
                            fs.unlink("./public/img/" + files[f], err => {
                                if(err)
                                    res.type("json").status(422).json({status: "error", data: err});
                            });
                });
                req.session.destroy(function(err) {
                    if (err) {
                        res.type("json").status(422).json({status: "error", data: err});
                    } else {
                        res.type("json").status(200).json({status: "ok"});
                    }
                });
            }
        }
    });
}


// GET My Incidences, left menu.
exports.web_myincidences = function(req, res, next) {
    session = req.session;

    userschema.find({telegram: session.user.id}, function(err, docs) {
        if (docs.length != 0)
            res.render('myincidences', {title: "SCQN - My Incidences", incidences: docs[0].incidences});
    });
}


// POST Solve & Leave Pending Incidence, My Incidences.
exports.web_solveincidence = function(req, res, next) {
    session = req.session;
    
    let data = {
        user: req.body.userId || session.user.id,
        incidence: req.body.incidenceId,
        solText : escapeInput(req.body.solText)
    };

    userschema.find({telegram: data.user}, function(err, docs) {
        for(i in docs[0].incidences) {
            if(docs[0].incidences[i]._id == data.incidence) {
                if (!docs[0].incidences[i].solved)
                    docs[0].incidences[i].solved = true;
                else
                    docs[0].incidences[i].solved = false;
                docs[0].incidences[i].solText = data.solText;
                docs[0].save(err => {
                    if (err) {
                        res.type("json").status(422).json({status: "error", data: err});
                    } else {
                        if (docs[0].notify) {
                            let text = '';
                            docs[0].incidences[i].solved? text = 'solved': text = 'left pending';
                            bot.telegram.sendMessage(docs[0].telegram, 'An incidence has been ' + text + '.\nHi ' + docs[0].name + ',\nFollowing incidence has been ' + text + `:\n${url}map?inc=` + docs[0].incidences[i]._id);
                            if (docs[0].email != '') {
                                let mailOptions = {
                                    from: email,
                                    to: docs[0].email,
                                    subject: 'Incidence ' + text + '.',
                                    html: '<div style="text-align: center;"><h1 style="color: navy">An incidence has been ' + text + '.</h1><p>Hi <b>' + docs[0].name + '</b>,</p><p>Following incidence has been ' + text + `:</p><br><a href="${url}map?inc=` + docs[0].incidences[i]._id + '" style="padding: 10px; background: navy; border-radius: 10px; color: #fff;">Incidence Link</a><br><br><p>Message sent to ' + docs[0].email + '. If you do not want to receive this type of messages from SCQ Notifyer again, you can edit your profile or unsubscribe.</p><br><p>Thanks,<br>SCQ Notifyer team.</p></div>'
                                };
                                transporter.sendMail(mailOptions, function(err, info) {
                                    if (err) {
                                        console.log(err);
                                    } else {
                                        console.log('Email sent: ' + info.response);
                                    }
                                });
                            }
                        }
                        res.type("json").status(200).json({status: "ok"});
                    }
                });
                break;
            }
        }
    });
}


// POST Edit Incidence, My Incidences.
exports.web_editincidence = function(req, res, next) {
    session = req.session;

    let data = {
        user: req.body.userId || session.user.id,
        incidence: req.body.incidenceId,
        description: escapeInput(req.body.description),
        solText: escapeInput(req.body.solText)
    };
    
    userschema.find({telegram: data.user}, function(err, docs) {
        for(i in docs[0].incidences) {
            if(docs[0].incidences[i]._id == data.incidence) {
                docs[0].incidences[i].description = data.description;
                data.solText !== 'undefined'? docs[0].incidences[i].solText = data.solText: docs[0].incidences[i].solText = '';
                docs[0].save(err => {
                    if (err) {
                        res.type("json").status(422).json({status: "error", data: err});
                    } else {
                        if (docs[0].notify) {
                            bot.telegram.sendMessage(docs[0].telegram, 'An incidence has been edited.\nHi ' + docs[0].name + `,\nFollowing incidence has been edited:\n${url}map?inc=` + docs[0].incidences[i]._id);
                            if (docs[0].email != '') {
                                let mailOptions = {
                                    from: email,
                                    to: docs[0].email,
                                    subject: 'Incidence edited.',
                                    html: '<div style="text-align: center;"><h1 style="color: navy">An incidence has been edited.' + '</h1><p>Hi <b>' + docs[0].name + `</b>,</p><p>Following incidence has been edited:</p><br><a href="${url}map?inc=` + docs[0].incidences[i]._id + '" style="padding: 10px; background: navy; border-radius: 10px; color: #fff;">Incidence Link</a><br><br><p>Message sent to ' + docs[0].email + '. If you do not want to receive this type of messages from SCQ Notifyer again, you can edit your profile or unsubscribe.</p><br><p>Thanks,<br>SCQ Notifyer team.</p></div>'
                                };
                                transporter.sendMail(mailOptions, function(err, info) {
                                    if (err) {
                                        console.log(err);
                                    } else {
                                        console.log('Email sent: ' + info.response);
                                    }
                                });
                            }
                        }
                        res.type("json").status(200).json({status: "ok"});
                    }
                });
                break;
            }
        }
    });
}


// POST Delete Incidence, My Incidences.
exports.web_deleteincidence = function(req, res, next) {
    session = req.session;

    let data = {
        user: req.body.userId || session.user.id,
        incidence: req.body.incidenceId
    };

    userschema.find({telegram: data.user}, function(err, docs) {
        for(i in docs[0].incidences) {
            if(docs[0].incidences[i]._id == data.incidence) {
                fs.unlink("./public/img/" + docs[0].incidences[i].img, err => {
                    if (err)
                        res.type("json").status(422).json({status: "error", data: err});
                });
                docs[0].incidences.splice(i, 1);
                docs[0].save(err => {
                    if (err) {
                        res.type("json").status(422).json({status: "error", data: err});
                    } else {
                        if (docs[0].notify) {
                            bot.telegram.sendMessage(docs[0].telegram, 'An incidence has been deleted.\nHi ' + docs[0].name + ',\nOne of your incidences has been deleted.');
                            if (docs[0].email != '') {
                                let mailOptions = {
                                    from: email,
                                    to: docs[0].email,
                                    subject: 'Incidence deleted.',
                                    html: '<div style="text-align: center;"><h1 style="color: navy">An incidence has been deleted.' + '</h1><p>Hi <b>' + docs[0].name + '</b>,</p><p>One of your incidences has been deleted.</p><br><br><p>Message sent to ' + docs[0].email + '. If you do not want to receive this type of messages from SCQ Notifyer again, you can edit your profile or unsubscribe.</p><br><p>Thanks,<br>SCQ Notifyer team.</p></div>'
                                };
                                transporter.sendMail(mailOptions, function(err, info) {
                                    if (err) {
                                        console.log(err);
                                    } else {
                                        console.log('Email sent: ' + info.response);
                                    }
                                });
                            }
                        }
                        res.type("json").status(200).json({status: "ok"});
                    }
                });
                break;
            }
        }
    });
}


// GET Admin Access, left menu.
exports.web_adminlogin = function(req, res, next) {
    res.render('adminlogin', {title: "SCQN - Admin Login"});
}


// POST Check password, Admin Access.
exports.web_checkpassword = function(req, res, next) {
    session = req.session;
    if (escapeInput(req.body.password) == process.env.SPECIAL_PASSWORD) {
        session.user.admin = true;
        res.type("json").status(200).json({status: "ok"});
    } else {
        res.type("json").status(200).json({status: "error"});
    }
}


//////////////////////////////////////////////////////////////
///// AGENT FUNCTIONS ////////////////////////////////////////
//////////////////////////////////////////////////////////////

// Get Municipality Incidences, left menu.
exports.web_manageagentincidences = function(req, res, next) {
    session = req.session;
    municipalityschema.find({ine: session.user.agent}, function(err, municipality) {
        if (municipality.length != 0 && municipality[0].agents.includes(session.user.id)) {
            userschema.find({}, function(err, docs) {
                if (docs.length != 0) {
                    let incidences = [];
                    for (i in docs) {
                        for (j in docs[i].incidences) {
                            if (docs[i].incidences[j].municipality == session.user.agent) {
                                docs[i].incidences[j].user = docs[i].telegram;
                                incidences.push(docs[i].incidences[j]);
                            }
                        }
                    }
                    res.render('manageagentincidences', {title: "SCQN - Manage Municipality Incidences", municipality: municipality[0].name, incidences: incidences});
                } else {
                    res.render('manageagentincidences', {title: "SCQN - Manage Municipality Incidences", municipality: municipality[0].name, incidences: []});
                }
            });
        } else {
            res.render('manageagentincidences', {title: "SCQN - Manage Municipality Incidences", municipality: municipality[0].name, incidences: []});
        }
    });
}


//////////////////////////////////////////////////////////////
///// ADMIN FUNCTIONS ////////////////////////////////////////
//////////////////////////////////////////////////////////////

// GET Manage Incidences, left menu.
exports.web_manageincidences = function(req, res, next) {
    userschema.find({}, function(err, docs) {
        if (docs.length != 0) {
            let incidences = [];
            for (i in docs) {
                for (j in docs[i].incidences)
                    docs[i].incidences[j].user = docs[i].telegram;
                incidences = incidences.concat(docs[i].incidences);
            }
            incidences.sort(function compare(a, b) {
                let dateA = new Date(a.date);
                let dateB = new Date(b.date);
                return dateB - dateA;
            });
            res.render('manageincidences', {title: "SCQN - Manage Incidences", incidences: incidences});
        }
    });
}

// GET Add Municipality, left menu.
exports.web_managemunicipalities = function(req, res, next) {
    res.render('addmunicipality', {title: "SCQN - Add Municipality"});
}

// GET get municipality info, addmunicipality view.
exports.web_getmunicipality = function (req, res, next) {
    let municipality = req.query.municipality.replace(/\s/g, '+');
    // municipality = municipality.toLowerCase().split(' ').map(str => str.charAt(0).toUpperCase() + str.substring(1)).join('+');
    let url = `https://public.opendatasoft.com/api/records/1.0/search/?dataset=espana-municipios&facet=communidad_autonoma&facet=provincia&facet=municipio&refine.communidad_autonoma=Galicia&refine.municipio=${municipality}`;
    request(url, function (err, response, body) {
        if (err) {
            res.send({status: 'error', data: 'An Error occurred, please try again.'});
        } else {
            let data = JSON.parse(body);
            if (data.records.length == 0)
                res.send({status: 'error', data: 'Municipality not found, please try again.'});
            else
                res.send({status: 'ok', data: data});
        }
    });
}

// POST add municipality, addmunicipality view.
exports.web_addmunicipality = function (req, res, next) {
    municipalityschema.find({ine: req.body.ine}, function(err, docs) {
        if (err) {
            res.send({status: "error", data: err});
        } else {
            if (!docs.length) {
                let code = '';
                while(code.length < 8) {
                    let n = String.fromCharCode(parseInt(Math.random() * 75) + 48);
                    if (n.search(/[a-z0-9]/) != -1) code += n;
                }
                let newMunicipality = new municipalityschema({
                    name: req.body.municipality,
                    ine: req.body.ine,
                    email: req.body.email,
                    registerCode: code,
                });
                newMunicipality.save(function(err) {
                    if (err)
                        res.type('json').status(422).send({ status: "error", data: err });
                    else
                        res.type('json').status(200).send({ status: "ok", data: req.body.municipality + " saved successfully!"});
                });
            } else {
                res.type('json').status(200).send({ status: "error", data: req.body.municipality + " already exists!"});
            }
        }
    });
}
