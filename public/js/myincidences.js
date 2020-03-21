$(document).ready(function() {

    $.ajaxSetup({ cache: false });

    // Startsolve button event.
    $(document).on('click', 'button#startsolve', function() {
        $('.alert').remove();

        if ($('.editing').length != 0) row.html(original);

        btn = $(this);
        row = $(this).parent().parent();
        original = row.html();

        row.find('p#solText').html('<textarea id="solTextarea" class="editing md-textarea form-control">' + row.find('p#solText').text() + '</textarea>');
        
        btn.parent().children('button#startedit').hide();
        btn.parent().children('button#startsolve').hide();
        btn.parent().children('button#delete').hide();
        btn.parent().append('<button class="btn btn-success" id="solve">Solve</button><br>');
        btn.parent().append('<button class="btn btn-danger" id="cancel">Cancel</button>');
    });

    // Solve button event.
    $(document).on('click', 'button#solve', function() {
        $('.alert').remove();
        let btn = $(this);
        let incidenceId = btn.parent().parent().children('input[type=hidden]').val();
        if (confirm("You are going to solve this incidence.\nYou will not be able to modify it again.\nAre you sure?")) {
            $.post('/solveincidence', {incidenceId: incidenceId, solText: $('#solTextarea').val()}, function(res) {
                if (res.status == 'error')
                    $('.card-header').before('<div class="alert alert-danger" role="alert">Error solving incidence!</div>');
                else {
                    btn.parent().children('button#delete').show();
                    row.find('p#solText').before('<p class="alert alert-success">SOLVED</p>');
                    row.find('p#solText').html($('#solTextarea').val());
                    btn.parent().children('button#cancel').remove();
                    btn.parent().children('button#solve').remove();
                    $('.card-header').before('<div class="alert alert-success" role="alert">Incident solved!</div>');
                }
            });
        }
    });

    // Startedit button event.
    $(document).on('click', 'button#startedit', function() {
        $('.alert').remove();

        if ($('.editing').length != 0) row.html(original);

        btn = $(this);
        row = $(this).parent().parent();
        original = row.html();

        row.find('p#description').html('<textarea id="descriptionArea" class="editing md-textarea form-control">' + row.find('p#description').text() + '</textarea>');
        
        btn.parent().children('button#startedit').hide();
        btn.parent().children('button#startsolve').hide();
        btn.parent().children('button#delete').hide();
        btn.parent().append('<button class="btn btn-success" id="edit">Edit</button><br>');
        btn.parent().append('<button class="btn btn-danger" id="cancel">Cancel</button>');
    });

    // Edit button event.
    $(document).on('click', 'button#edit', function() {
        $('.alert').remove();
        let btn = $(this);
        let data = {
            incidenceId: btn.parent().parent().children('input[type=hidden]').val(),
            description: $('#descriptionArea').val(),
        }
        $.post('/editincidence', {incidenceId: data.incidenceId, description: data.description}, function(res) {
            if (res.status == 'error')
                $('.card-header').before('<div class="alert alert-danger" role="alert">Error editing incidence!</div>');
            else {
                btn.parent().children('button#delete').show();
                btn.parent().children('button#startedit').show();
                btn.parent().children('button#startsolve').show();
                row.find('p#description').html($('#descriptionArea').val());
                btn.parent().children('button#cancel').remove();
                btn.parent().children('button#edit').remove();
                $('.card-header').before('<div class="alert alert-success" role="alert">Incident edited!</div>');
            }
        });
    });

    // Cancel button event.
    $(document).on('click', 'button#cancel', function() {
        row.html(original);
    });

    // Delete button event.
    $(document).on('click', 'button#delete', function() {
        $('.alert').remove();
        let btn = $(this);
        let incidenceId = btn.parent().parent().children('input[type=hidden]').val();
        if (confirm("You are going to delete this incidence.\nAre you sure?")) {
            $.post('/deleteincidence', {incidenceId: incidenceId}, function(res) {
                if (res.status == 'error')
                    $('.card-header').before('<div class="alert alert-danger" role="alert">Error deleting incidence!</div>');
                else {
                    btn.parent().parent().parent().parent().parent().remove();
                    $('.card-header').before('<div class="alert alert-success" role="alert">Incidence deleted!</div>');
                }
            });
        }
    });

});
