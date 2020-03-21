$(document).ready(function() {

    var map = L.map('map');

    L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, <a href="https://solarmobi.iessanclemente.net">SolarMobi</a>',maxZoom: 22
    }).addTo(map);

    if (!incidences.length)
        incidences = [incidences];

    L.control.scale().addTo(map);
    if (incidences[0].length != 0) {
        for(let i = incidences.length - 1; i >= 0; i--) {
            let marker = L.marker([incidences[i].lat, incidences[i].lon]).addTo(map);
            let text = "<div class='text-center'>" + "<img width='100' src='img/" + incidences[i].img + "' alt='NO IMG'><br>" + incidences[i].description + "<br>";
            if(incidences[i].solved)
                text += "<p class='text-success'>SOLVED</p></div>";
            else
                text += "<p class='text-danger'>PENDING</p></div>";
            marker.bindPopup(text);
            if (i == 0) {
                map.setView([incidences[i].lat, incidences[i].lon], 13);
                marker.openPopup();
            }
        }
    } else {
        map.setView([42.8805199, -8.5456896], 13);
    }

});
