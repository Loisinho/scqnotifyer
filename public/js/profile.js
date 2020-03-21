//////////////////////////////////////////////////////////////
///// Perfil JS App (perfil.ejs) /////////////////////////////
//////////////////////////////////////////////////////////////

$(document).ready(function() {

    $.ajaxSetup({ cache: false });

    // Save button event.
    $('form').on('submit', function(e) {
        e.preventDefault();
        
        $('.alert').remove();

        $.post('/profile', {name: $('input#name').val(), lastname: $('input#lastname').val(), email: $('input#email').val(), notify: $('input#notify').is(':checked')}, function(result) {
            // console.log(result);
            $('input#name').val(result.data.name);
            $('input#lastname').val(result.data.lastname);
            $('input#email').val(result.data.email);
            $('input#notify').val(result.data.notify);

            if (result.status == 'ok')
                $('.card-header').before('<div class="alert alert-success" role="alert">Profile updated successfully!</div>');
            else
                $('.card-header').before('<div class="alert alert-danger" role="alert">Error updating profile!</div>');
        });
    });

    // Delete account button.
    $('button#delete').on('click', function() {
        $('.alert').remove();
        if (confirm('You are going to delete this account. Are you sure?')) {
            $.get('/deleteaccount', function(result) {
                if (result.status == 'error')
                    $('.card-header').before('<div class="alert alert-danger" role="alert">Error deleting account!</div>');
                else
                    location.assign('/');
            });
        }
    });

});
