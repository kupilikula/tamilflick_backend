
// Script for setting up node server and serving our web application.
const APP_NAME = 'tamilflick';

const express = require('express');
const app = express();
const auth = require('authentication');
const database = require('database');
const membership = require('membership');
const jwt = require('jwt');
const cookieParser = require('cookie-parser');


// Connect to members database
console.log('Starting Server App.');
database.open_database_client().then(() => {
	console.log('Opened Database Client.');
database.get_database(APP_NAME + '_members').then( (members) => {
	console.log('Retrieved Members Database.');
database.get_database(APP_NAME + '_tokens').then( (tokens) => {
	console.log('Retrieved Tokens Database.')
	// Allow JSON data exchange
	app.use(express.json());
	app.use(cookieParser());

	// Set Routes
	console.log('Mounting guest routes.');
	// Guest Routes

	app.post('/signup', async function (req, res) { 
		console.log('Signup request received');
		let signup_result = await auth.create_new_user(req.body, members);
		res.send(signup_result);
	});

	app.post('/login', async function (req, res) {
		console.log('Login request received');
		let result = await auth.login_user(req.body, members);
		res.send(result);

	});

	app.get('/forgotpassword', function (req, res) {
		res.redirect('/guest/html/forgotpassword.html');

	});
	app.post('/forgotpassword', async function (req, res) {
		console.log('Forgot password request received');
		let result = await auth.send_change_password_email(req.body, members, tokens);
		res.send(result);

	});

	app.get('/newpassword/:token', function (req, res) {
		res.redirect('/guest/html/newpassword.html?token=' + req.params.token);
	});

	app.post('/newpassword/:token', async function (req, res) {
		console.log('New password request received');
		let result = await auth.change_password(req.body, req.params, members, tokens);
		res.send(result);
		//res.redirect('/guest/html/newpassword.html');
	});


	// Member routes
	console.log('Mounting member routes.');
	// app.use('/member', validate_or_refresh_session_token, express.static('../member'));

	// app.use('/courses/:courseid/', validate_or_refresh_session_token, 
	// 	// verify access to course and serve it.
	// 	function (req, res, next) {
	// 		get_member_info(req.cookies.session_token, members, (member_info) => {
				
	// 			let access_ok = (member_info.courses) && member_info.courses.includes(req.params.courseid);				
	// 			if (access_ok) {							
	// 				express.static('../courses/' + req.params.courseid)(req, res, next);
	// 			}else {
	// 				res.writeHead(302, {'Location' : '/', 'Set-Cookie' : 'session_token=' + req.cookies.session_token + '; path=/;'});
	// 				res.send();
	// 			}
	// 		});
	// 	}
	// );

	// app.use('/', go_home);

	app.use(express.static('./dist/tamilflick'));
	app.use('/',async (req,res) => { res.sendFile('./dist/tamilflick/index.html')});
	// Listen on port
	console.log('Listening on port.');
	app.listen(3000);

});

});

});

async function get_member_info(session_token, members, callback) {
	let token_data = jwt.extract_data_from_jwt(session_token);
	let courses = await membership.get_allowed_courses(token_data.payload.emailaddress, members);
	callback({'emailaddress' : token_data.payload.emailaddress, 'courses' : courses});
}


async function validate_or_refresh_session_token(req, res, next){

	let token = req.cookies.session_token;
	if (!token) {
		res.redirect('/login');

	} else
	{
		let token_check = await auth.validate_session_token(token);

		if (token_check.refresh){
			req.cookies.session_token = token_check.new_session_token;
			res.cookie('session_token', req.cookies.session_token ,{path : '/'});

		}

		if (token_check.valid || token_check.refresh) {			
			next();

		}else
		{
			res.redirect('/login');
		}
	}

}



async function go_home(req, res, next)
{
	let token = req.cookies.session_token;
	if (!token) {
		res.redirect('/guest/html/home.html');

	} else
	{
		let token_check = await auth.validate_session_token(token);
		
		if (token_check.refresh){
			req.cookies.session_token = token_check.new_session_token;
			res.cookie('session_token', req.cookies.session_token ,{path : '/'});			
		}

		if (token_check.valid || token_check.refresh) {
			res.writeHead(302, {'Location': '/member/html/home.html', 'Set-Cookie' : 'session_token=' + req.cookies.session_token + '; path=/;'});
			res.send();

		}else
		{
			res.redirect('/guest/html/home.html');
		}
	}

}




