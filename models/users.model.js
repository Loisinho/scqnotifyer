const mongoose = require('mongoose');

const Schema = mongoose.Schema;


let incidenceSchema = new Schema ({
    img:                {type: String, required: false, max: 120},
    lat:                {type: Number, required: true},
    lon:                {type: Number, required: true},
    municipality:       {type: String, required: true, max: 100},
    description:        {type: String, required: true, max: 255},
    date:               {type: Date, required: false, default: Date.now},
    solved:             {type: Boolean, required: false, default: 0},
    solText:            {type: String, required: false, max: 255, default: ''},
});


let userSchema = new Schema ({
    name:               {type: String, required: true, max: 50},
    lastname:           {type: String, required: false, max: 100},
    username:           {type: String, required: false, max: 50},
    telegram:           {type: String, required: true, max: 50},
    email:              {type: String, required: false, max: 120, default: ''},
    agent:              {type: String, required: false, max: 100, default: ''},
    notify:             {type: Boolean, required: false, default: 1},

    tg_command:         {type: String, required: false, default: ''},
    tg_img:             {type: String, required: false, default: ''},
    tg_coords:          {type: String, required: false, default: ''},
    tg_description:     {type: String, required: false, max: 255, default: ''},
    tg_municipality:    {type: String, required: false, max: 100, default: ''},

    incidences:         [incidenceSchema],
});


let municipalitySchema = new Schema ({
    name:               {type: String, required: true, max: 100},
    ine:                {type: String, required: true, max: 50},
    email:              {type: String, required: false, max: 120, default: ''},
    registerCode:       {type: String, required: true, max: 120},

    agents:             [],
});


module.exports = {userschema: mongoose.model('User', userSchema), incidenceschema: mongoose.model('Incidence', incidenceSchema), municipalityschema: mongoose.model('Municipality', municipalitySchema)};
