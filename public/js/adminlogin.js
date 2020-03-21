$(document).ready(function() {

    $.ajaxSetup({ cache: false });

    $(document).on('submit', 'form', function(e) {
        e.preventDefault();
        $('.alert').remove();
        $.post('adminlogin', {password: $('input[type="password"]').val()}, function(res) {
            if (res.status == 'error') {
                $('.container').before('<div class="alert alert-danger" role="alert">Wrong password!</div>');
            } else {
                location.assign('manageincidences');
            }
        });
    });

});
