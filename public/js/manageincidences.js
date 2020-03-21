$(document).ready(function() {

    $.ajaxSetup({ cache: false });

    // Startsolve button event.
    $(document).on('click', 'button#startsolve', function() {
        $('.alert').remove();

        if ($('.editing').length != 0) row.html(original);

        btn = $(this);
        row = $(this).parent().parent();
        original = row.html();

        row.find('p#solText').html('<textarea id="solTextarea" class="editing md-textarea form-control" placeholder="Report info..">' + row.find('p#solText').text() + '</textarea>');
        
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
        let userId = btn.parent().parent().children('input#userId').val();
        let incidenceId = btn.parent().parent().children('input#incidenceId').val();
        let solText = $('#solTextarea').val();
        if (confirm("You are going to solve this incidence.\nAre you sure?")) {
            $.post('/solveincidence', {userId: userId, incidenceId: incidenceId, solText: solText}, function(res) {
                if (res.status == 'error')
                    $('.card-header').before('<div class="alert alert-danger" role="alert">Error solving incidence!</div>');
                else {
                    btn.parent().children('button#delete').show();
                    btn.parent().children('button#startedit').show();
                    btn.parent().append('<button class="btn btn-warning" id="leavepending">Leave Pending</button>');
                    row.find('p#solText').html($('#solTextarea').val());
                    btn.parent().children('button#cancel').remove();
                    btn.parent().children('button#solve').remove();
                    btn.parent().children('button#startsolve').remove();
                    $('.card-header').before('<div class="alert alert-success" role="alert">Incident solved!</div>');
                }
            });
        }
    });

    // Leave Pending button event.
    $(document).on('click', 'button#leavepending', function() {
        $('.alert').remove();
        let btn = $(this);
        let row = $(this).parent().parent();
        let userId = btn.parent().parent().children('input#userId').val();
        let incidenceId = btn.parent().parent().children('input#incidenceId').val();
        if (confirm("You are going to leave this incidence pending.\nAre you sure?")) {
            $.post('/solveincidence', {userId: userId, incidenceId: incidenceId, solText: ''}, function(res) {
                if (res.status == 'error')
                    $('.card-header').before('<div class="alert alert-danger" role="alert">Error leaving the incidence pending!</div>');
                else {
                    btn.parent().append('<button class="btn btn-success" id="startsolve">Solve</button>');
                    row.find('p#solText').html('');
                    btn.parent().children('button#leavepending').remove();
                    $('.card-header').before('<div class="alert alert-success" role="alert">Incident left pending!</div>');
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
        if (row.find('p#solText').text() != '')
            row.find('p#solText').html('<textarea id="solTextarea" class="editing md-textarea form-control">' + row.find('p#solText').text() + '</textarea>');
        
        btn.parent().children('button#delete').hide();
        btn.parent().children('button#startedit').hide();
        btn.parent().children('button#startsolve').hide();
        btn.parent().children('button#leavepending').hide();
        btn.parent().append('<button class="btn btn-success" id="edit">Edit</button><br>');
        btn.parent().append('<button class="btn btn-danger" id="cancel">Cancel</button>');
    });

    // Edit button event.
    $(document).on('click', 'button#edit', function() {
        $('.alert').remove();
        let btn = $(this);
        let userId = btn.parent().parent().children('input#userId').val();
        let incidenceId = btn.parent().parent().children('input#incidenceId').val();
        let description = $('#descriptionArea').val();
        let solText = '';
        if ($('#solTextarea'))
            solText = $('#solTextarea').val();
        $.post('/editincidence', {userId: userId, incidenceId: incidenceId, description: description, solText: solText}, function(res) {
            if (res.status == 'error')
                $('.card-header').before('<div class="alert alert-danger" role="alert">Error editing incidence!</div>');
            else {
                btn.parent().children('button#delete').show();
                btn.parent().children('button#startedit').show();
                btn.parent().children('button#startsolve').show();
                btn.parent().children('button#leavepending').show();
                row.find('p#description').html($('#descriptionArea').val());
                if ($('#solTextarea'))
                    row.find('p#solText').html($('#solTextarea').val());
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
        let userId = btn.parent().parent().children('input#userId').val();
        let incidenceId = btn.parent().parent().children('input#incidenceId').val();
        if (confirm("You are going to delete this incidence.\nAre you sure?")) {
            $.post('/deleteincidence', {userId: userId, incidenceId: incidenceId}, function(res) {
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
