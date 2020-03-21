$(document).ready(function() {
                    
    $.ajaxSetup({cache: false});
                    
    $('form').submit(function(e) {
        e.preventDefault();

        $('.alert').remove();
        $('#municipalityinfo').empty();
        $('#municipalityincidences').empty();

        $.get('/getmunicipalityincidences', {municipality: $('#municipality').val()}, function (res) {
            if (res.status == 'error') {
                $('.card').before('<div class="alert alert-danger" role="alert">' + res.data + '</div>');
            } else {
                let info = `<table class="table table-bordered">
                              <thead class="thead-light">
                                <tr>
                                  <th scope="col">NAME</th>
                                  <th scope="col">INE</th>
                                  <th scope="col">EMAIL</th>
                                  <th scope="col">AGENT CODE</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  <td>${res.info.name}</td>
                                  <td>${res.info.ine}</td>
                                  <td>${res.info.email}</td>
                                  <td>${res.info.registerCode}</td>
                                </tr>
                              </tbody>
                            </table>`;
                $('#municipalityinfo').append(info);
                if (res.data.length != 0) {
                    let incidences = res.data;
                    for (i in incidences) {
                        let date = new Date(incidences[i].date);
                        let card = `<div class="card float-right w-100">
                                      <div class="row">
                                        <div class="col-xl-2">
                                          <img class="d-block w-100" src="img/${incidences[i].img}" alt="">
                                        </div>
                                        <div class="col-xl-10">
                                          <div class="card-block">
                                            <p>${incidences[i].description}</p>
                                            <p><b>${date.toLocaleDateString('en-GB')}, ${date.toLocaleTimeString('en-GB')}</b></p>
                                            <p><b>${incidences[i].municipality}, Coords: ${incidences[i].lat}, ${incidences[i].lon}<br>
                                              <a href="/map?inc=${incidences[i]._id}">See on map</a></b></p>`;
                        if (!incidences[i].solved)
                            card += '<p class="alert alert-danger">PENDING</p>';
                        else
                            card += '<p class="alert alert-success">SOLVED</p>';
                        card += `<p>${incidences[i].solText}</p></div></div></div></div>`;
                        $('#municipalityincidences').append(card);
                    }
                } else {
                    $('#municipalityincidences').append('<h5 class="card-title text-center">There are no incidences.</h5>');
                }
            }
        });

    });
});
