const express = require('express');
const router = express.Router();

const web_controller = require('../controllers/web.controller');

let {isLoggedIn, isUser, isAgent, hasAuth} = require('../middleware/hasAuth.js');

router.use(isLoggedIn);


// Public Routes:
router.get('/tests', web_controller.web_test);
router.get('/', web_controller.web_root);
router.get('/info', web_controller.web_info);
router.get('/incidences', web_controller.web_incidences);
router.get('/municipalities', web_controller.web_municipalities);
router.get('/getmunicipalityincidences', web_controller.web_getmunicipalityincidences);
router.get('/map', web_controller.web_map);
router.get('/meteo', web_controller.web_meteo);
router.get('/getmeteo', web_controller.web_showmeteo);
router.get('/login', web_controller.web_login);
router.post('/loginx', web_controller.web_loginx);


// Private Routes. They use the logging middleware:
router.get('/disconnect', isUser, web_controller.web_disconnect);
router.get('/profile', isUser, web_controller.web_profile);
router.post('/profile', isUser, web_controller.web_update_profile);
router.get('/deleteaccount', isUser, web_controller.web_delete_account);
router.get('/myincidences', isUser, web_controller.web_myincidences);
router.post('/solveincidence', isUser, web_controller.web_solveincidence);
router.post('/editincidence', isUser, web_controller.web_editincidence);
router.post('/deleteincidence', isUser, web_controller.web_deleteincidence);

router.get('/adminlogin', isUser, web_controller.web_adminlogin);
router.post('/adminlogin', isUser, web_controller.web_checkpassword);

router.get('/manageagentincidences', isAgent, web_controller.web_manageagentincidences);


// Admin private Routes. They use the authorization middleware.
router.get('/manageincidences', hasAuth, web_controller.web_manageincidences);
router.get('/addmunicipality', hasAuth, web_controller.web_managemunicipalities);
router.post('/addmunicipality', hasAuth, web_controller.web_addmunicipality);
router.get('/getmunicipality', hasAuth, web_controller.web_getmunicipality);


module.exports = router;
