$(document).ready(function() {
                    
    $.ajaxSetup({cache: false});
                    
    $('form').submit(function(e) {
        e.preventDefault();

        $('.alert').remove();

        if($('input#search').length != 0) {
            $.get('/getmunicipality', {municipality: $('#municipality').val()}, function (res) {
                if (res.status == 'error') {
                    $('.card').before('<div class="alert alert-danger" role="alert">' + res.data + '</div>');
                } else {
                    let data = res.data.records[0].fields;
                    $('#municipality').val(data.municipio);
                    $('#inediv').css({'display': 'block'});
                    $('#emaildiv').css({'display': 'block'});
                    $('#municipality').attr('disabled', true);
                    if (data.codigo_postal)
                        $('#ine').val(data.codigo_postal);
                    else
                        $('#ine').val(data.municipio);
                    $('input[type="submit"]').attr('id', 'add');
                    $('input[type="submit"]').val('Add');
                }
            });
        } else if($('input#add').length != 0) {
            $.post('/addmunicipality', {municipality: $('#municipality').val(), ine: $('#ine').val(), email: $('#email').val()}, function(res) {
                if (res.status == 'error')
                    $('.card').before('<div class="alert alert-danger" role="alert">' + res.data + '</div>');
                else
                    $('.card').before('<div class="alert alert-success" role="alert">' + res.data + '</div>');
                $('#municipality').attr('disabled', false);
                $('#municipality').val('');
                $('#inediv').css({'display': 'none'});
                $('#email').val('');
                $('#emaildiv').css({'display': 'none'});
                $('input[type="submit"]').attr('id', 'search');
                $('input[type="submit"]').val('Search');
            });
        }
    });
});
