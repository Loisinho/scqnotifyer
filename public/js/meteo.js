$(document).ready(function() {
                    
    $.ajaxSetup({cache: false});
                    
    $('form').submit(function(e) {
        e.preventDefault();

        $('.alert').remove();
        $.get('/getmeteo', {city: $('#city').val()}, function (res) {
            let info = res.info;
            if (res.status == 'error') {
                $('.card').before('<div class="alert alert-danger" role="alert">' + info + '</div>');
            } else {
                $('div#result').empty();

                let text = `Información sobre <strong>${info.name}</strong><br/>`;
                text += `Méteo actual:<br/>`;
                text += `<img src='http://openweathermap.org/img/wn/${info.weather[0].icon}@2x.png' alt='${info.weather[0].description}'/><br/>`;

                text += `Coordenadas (latitud,longitud): <strong>(${info.coord.lat},${info.coord.lon})</strong>.<br/>`;
                text += `Temperatura actual: <strong>${info.main.temp}ºC</strong>.<br/>`;
                text += `Sensación térmica: <strong>${info.main.feels_like}ºC</strong>.<br/>`;
                text += `Temperatura mínima: <strong>${info.main.temp_min}ºC</strong>.<br/>`;
                text += `Temperatura máxima: <strong>${info.main.temp_max}ºC</strong>.<br/>`;
                text += `Presión atmosférica: <strong>${info.main.pressure}</strong>.<br/>`;
                text += `Velocidad del viento: <strong>${info.wind.speed} Km/h</strong>.<br/>`;
                text += `Dirección del viento: <strong>${info.wind.deg}</strong>.<br/>`;

                // Conversión de hora en formato Unix a hh:mm
                var date = new Date(info.sys.sunrise * 1000);
                var min = "0" + date.getMinutes();
                var sunrise = date.getHours() + ':' + min.substr(-2);

                var date = new Date(info.sys.sunset * 1000);
                var min = "0" + date.getMinutes();
                var sunset = date.getHours() + ':' + min.substr(-2);

                text += `Hora amanecer: <strong>${sunrise}</strong>.<br/>`;
                text += `Hora puesta de sol: <strong>${sunset}</strong>.<br/>`;
                text += `Humedad: <strong>${info.main.humidity}%</strong>.<br/>`;

                $('div.card-body').append('<div id="result">' + text + '</div>');
            }
        });
    });
});
