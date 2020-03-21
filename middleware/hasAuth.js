exports.isLoggedIn = function(req, res, next) {
    user = req.session.user || null;
    next();
}


exports.isUser = function(req, res, next) {
    if (req.session.user) {
        next();
    } else {
        res.render('401', {title: "401 Error"});
    }
}


exports.isAgent = function(req, res, next) {
    if (req.session.user && req.session.user.agent != '') {
        next();
    } else {
        res.render('401', {title: "401 Error"});
    }
}


exports.hasAuth = function(req, res, next) {
    if (req.session.user && req.session.user.admin) {
        next();
    } else {
        res.render('401', {title: "401 Error - SB Admin"});
    }
}
