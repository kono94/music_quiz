// server.js

// set up ======================================================================
// get all the tools we needvar express  = require('express');
var express  = require('express');
var app      = express();
var port     = process.env.PORT || 3000;
var flash    = require('connect-flash');
var mysql    = require("mysql");
var passport = require('passport');
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var ejs = require('ejs');
var _ = require('underscore')._;
var levenshtein = require('fast-levenshtein');
var CronJob = require('cron').CronJob;

var cookieParser = require('cookie-parser');
var bodyParser   = require('body-parser');
var session      = require('express-session');
var morgan       = require('morgan');
var configDB = require('./config/database.js');

// First you need to create a connection to the db
var con = mysql.createConnection({
  host: configDB.host, 
  user: configDB.user,
  password: configDB.password,
    database: configDB.database
  
});
con.connect(function(err){
  if(err){
    console.log('Error connecting to Db' +  err);
    return;
  }
  console.log('Connection established');
});


app.use(express.static(__dirname + '/public/static'));
app.set('views', __dirname + '/public');
app.set('view engine', 'ejs');



app.get('/', function(req, res){
	res.render('game.ejs');
});


// usernames which are currently connected to the chat
var users = {};
var intervalRunning = false;
var intervalStartTime = Math.floor(Date.now() / 1000);

var currentSongPreview = "";
var currentSongID = 0;
var currentSongArtist = "";
var currentSongName = "";
var currentSongImage = "";

var lastSongPreview = "";
var lastSongID = 0;
var lastSongArtist = "";
var lastSongName = "";
var lastSongImage = "";


io.on('connection', function(client){ 	
	client.emit('chat message', "hallo user!");
	client.emit('chat message', "hallo 222user!");
    console.log('a user connected');
    
	
	client.on('chat message', function(msg){
		io.emit('chat message', msg);
		client.emit('chat message', "du hast eine neue nachricht geschrieben");
        io.sockets.emit("chat message", "new message an alle");
   });
	
	client.on('chat message', function(msg){
		console.log('message: ' + msg);
	});
	
	client.on('guess', function(data){	
		response = {"artist": false, "song" : false, "points_gained" : 0};
		points_gained = 0;
		artist_guess = data.artist_guess.toLowerCase().replace(/\s/g, "");
		songname_guess = data.songname_guess.toLowerCase().replace(/\s/g, "");
				
		
		//already guessed both correct
		if(users[client.id].artist == true && users[client.id].song == true){
			response.artist = true;
			response.song = true;
			response.points_gained = 0;	
			console.log("alrady guessed both correct:" + response);
			client.emit('guess_response', response);
			return;
		}
		
		//no input
		if(songname_guess == "" && artist_guess == ""){
			client.emit('guess_response', response);	
			return;
		}
		// checking for artist
		if(users[client.id].artist == false && artist_guess != ""){
			con.query('SELECT * FROM `mq_artist_options` WHERE song_id = ?', [currentSongID], function(err, result) {
			   if (err) throw err;						
			   for (var i in result){
					var sqlResult = result[i];
					var correctArtist = sqlResult["name"].toLowerCase().replace(/\s/g, "");
					if(correctArtist != ""){  
						console.log("correct artist: " +correctArtist);
						console.log("guessed artist: " + artist_guess);
						if(levenshtein.get(artist_guess, correctArtist) < Math.floor(correctArtist.length / 4) + 1){
							// GUESSED ARTIST RIGHT
							response.artist = true;
							response.points_gained += 3;
							console.log("guessed artist right");
							users[client.id].points += 3;
							users[client.id].artist = true;
							updateUserTable();
							break;							
						}
						else{
							// WRONG ARTIST GUESSED
						}	
					}				   
				}
				if(!(users[client.id].song == false && songname_guess != "")){	
					sentResponse();
				}
				
			});			
		}	
		// checking for song 
		if(users[client.id].song == false && songname_guess != ""){
			con.query('SELECT * FROM `mq_songname_options` WHERE song_id = ?', [currentSongID], function(err, result) {
				if (err) throw err;						
			   for (var i in result){
					var sqlResult = result[i];
					var correctSongName = sqlResult["name"].toLowerCase().replace(/\s/g, "");
					if(correctSongName != ""){  
						console.log("correct artist: " +correctSongName);
						console.log("guessed artist: " + songname_guess);
						if(levenshtein.get(songname_guess, correctSongName) < Math.floor(correctSongName.length / 4) + 1){
							// GUESSED SONG RIGHT
							response.song = true;
							response.points_gained += 3;
							console.log("guessed songname right");
							users[client.id].points += 3;
							users[client.id].song = true;
							updateUserTable();
							break;								
						}
						else{
							// WRONG SONG GUESSED
						}	
					}				   
				}	
				sentResponse();
			});			
		}	
		
		function sentResponse(){
			console.log(response);
			client.emit('guess_response', response);	
		}
				
		
	});
	
	client.on('addUser', function(username){		
		client.username = username;	
		users[client.id] = {"name" : username, "points" : 10, "artist" : false, "song" : false};		
		console.log('user entered username: ' + users[client.id].name + users[client.id].points);
		client.emit('login_confirmation', {"error" : false, "name" : users[client.id].name});
		for(var clientID in users){
				io.to(clientID).emit('update_message', "<strong>" + users[client.id].name + "</strong> connected to the Game !");
		}
		
		console.log(users);			
		sentCurrentPreview(client.id);
		update_last_song(client.id);
		
		updateUserTable();
	});
	
	
	client.on('change_username', function(new_username){			
		console.log("about to change the username for: " + users[client.id].name + " to :" + new_username);	
		//todo
		if(new_username != ""){
			for(var clientID in users){
				io.to(clientID).emit('update_message', "<strong>" + users[client.id].name + "</strong> change his/her username to <strong>" + new_username + "</string>");
			}
			client.username = new_username;
			users[client.id].name = new_username;		
			client.emit('change_username_response', {"error" : false, "error_message" : "", "new_username" : users[client.id].name});
			updateUserTable();			
		}else{
			client.emit('change_username_response', {"error" : true, "error_message" : "no input", "new_username" : users[client.id].name});
		}
		
	});
	
	client.on('update_correct_answers', function(song_id){
		console.log(song_id);		
		response = {"error" : true, "error_message" : "", "artists" : [], "songnames" : []};
		con.query('SELECT * FROM `mq_artist_options` WHERE song_id = ? ORDER BY upvotes DESC', [song_id], function(err, result) {
			if (err) throw err;				
			  for (var i in result){
					var sqlResult = result[i];
					var correctArtist = sqlResult["name"];
					response.artists[i] = {"name" : correctArtist, "id" : sqlResult["id"], "votes" :  sqlResult["upvotes"]};
					
			  }	
			  response.error = false;	  
		});
		
		con.query('SELECT * FROM `mq_songname_options` WHERE song_id = ? ORDER BY upvotes DESC', [song_id], function(err, result) {
				if (err) throw err;	
				 for (var i in result){
					var sqlResult = result[i];
					var correctSongName = sqlResult["name"];
					response.songnames[i] = {"name" : correctSongName, "id" : sqlResult["id"], "votes" :  sqlResult["upvotes"]};
					response.error = false;
			     }	
			  response.error = false;				  
		      client.emit('update_correct_answers', response);			
		});
	});
	
	client.on('add_new_artist', function(data){
		response = {"error" : true, "error_message" : "", "artist" : ""};
		new_artist = data.artist;
		response.artist = new_artist;
		song_id = data.song_id;
		if(new_artist.length == 0){

			response.error = true;
			response.error_message = "Your suggestion is too short or empty";
			client.emit('add_new_artist_response', response);
			return;
		}
		con.query('SELECT * FROM `mq_artist_options` WHERE `song_id` = ? AND name = ?', [song_id , new_artist], function(err, result) {
				if (err) throw err;	
				if(result.length == 0){
					con.query('INSERT INTO mq_artist_options (song_id, name) VALUES (?,?)', [song_id , new_artist], function(err, result) {
						if (err){	
							response.error = true;
							response.error_message = "database insert error";
							client.emit('add_new_artist_response', response);
							return;
						}else{
							response.error = false;							
							client.emit('update_correct_answers', response);
							  for(var clientID in users){
								io.to(clientID).emit('update_message', users[client.id].name + ' added "' + new_artist + '" to the correct artist answers');
							  }
						}						
					});
				}else{
					response.error = true;
					response.error_message = "Your suggestion is already in the answer pool";
					client.emit('add_new_artist_response', response);
					return;
				}
		});	
	});
	
	client.on('add_new_songname', function(data){
		response = {"error" : true, "error_message" : "", "songname" : ""};
		new_songname = data.songname;
		response.songname = new_songname;
		song_id = data.song_id;

		if(new_songname.length == 0){

			response.error = true;
			response.error_message = "Your suggestion is too short or empty";
			client.emit('add_new_songname_response', response);
			return;
		}
		con.query('SELECT * FROM `mq_songname_options` WHERE `song_id` = ? AND name = ?', [song_id , new_songname], function(err, result) {
			if (err) throw err;	
			if(result.length == 0){
				con.query('INSERT INTO mq_songname_options (song_id, name) VALUES (?,?)', [song_id , new_songname], function(err, result) {
					if (err){	
						response.error = true;
						response.error_message = "database insert error";
						client.emit('add_new_songname_response', response);
						return;
					}else{
						response.error = false;							
						client.emit('add_new_songname_response', response);
					    for(var clientID in users){
							io.to(clientID).emit('update_message', users[client.id].name + ' added "' + new_songname + '" to the correct song name answers');
						}
					}						
				});
			}else{
				response.error = true;
				response.error_message = "Your suggestion is already in the answer pool";
				client.emit('add_new_songname_response', response);
				return;
			}
		});			
	});
	
	
	client.on('upvote_songname_answer', function(data){
		id = data.id;
		vote_value = data.vote;
		response = {"error" : true, "error_message" : "", "upvoted" : true, "id" : id};
		if(vote_value > 0){
			vote_value = 1;
			response.upvoted = true;
		}else{
			vote_value = -1;
			response.upvoted = false;
		}
		con.query('UPDATE mq_songname_options SET upvotes = upvotes + ? WHERE id = ?', [vote_value, id], function(err, result) {
			if (err) {
				console.log(err);
				response.error = true;
				response.error_message = "update databse error";
				client.emit('upvote_songname_response', response);
				return;
			}else{
				response.error = false;
				client.emit('upvote_songname_response', response);
			}	
		});	
	});
	
	
	client.on('upvote_artist_answer', function(data){
		id = data.id;
		vote_value = data.vote;
		response = {"error" : true, "error_message" : "", "upvoted" : true, "id" : id};
		if(vote_value > 0){
			vote_value = 1;
			response.upvoted = true;
		}else{
			vote_value = -1;
			response.upvoted = false;
		}
		con.query('UPDATE mq_artist_options SET upvotes = upvotes + ? WHERE id = ?', [vote_value, id], function(err, result) {
			if (err) {
				console.log(err);
				response.error = true;
				response.error_message = "update databse error";
				client.emit('upvote_artist_response', response);
				return;
			}else{
				response.error = false;
				client.emit('upvote_artist_response', response);
			}	
		});	
	});	
	
	
	client.on('report', function(data){
		response = {"error" : true, "error_message" : "", "song_id" : 0, "reasons" : "["};
		song_id = data.song_id;
		adjustAnswers = 0;
		playbackProblem = 0;
		badSong = 0;
		notDisplayed = 0;
		if(data.adjustAnswers > 0){
			adjustAnswers = 1;
			response.reasons += "bad answers | ";
		}
		if(data.playbackProblem > 0){
			playbackProblem = 1;
			response.reasons += "playback problems | ";
		}
		if(data.badSong > 0){
			badSong = 1;
			response.reasons += "trash song | ";
		}
		if(data.notDisplayed > 0){
			notDisplayed = 1;
			response.reasons += "image is broken | ";
		}
		response.reasons += "]"; 		
		if(song_id > 0 && (adjustAnswers + playbackProblem + badSong + notDisplayed) > 0){		
			con.query('UPDATE mq_songs SET adjustAnswers = adjustAnswers + ?, playbackProblem = playbackProblem + ?, badSong = badSong + ?, notDisplayed = notDisplayed + ? WHERE id = ?', [adjustAnswers, playbackProblem, badSong, notDisplayed, song_id], function(err, result) {
				if (err) {
					response.error_message = "database error";
					response.error = true;
					client.emit('report_response', response);
					return;
				}
				else{
					response.error = false;
					response.song_id = song_id;
					client.emit('report_response', response);
					for(var clientID in users){
						io.to(clientID).emit('update_message', "<strong>" + users[client.id].name + "</strong> pulled a quentin and reported the last song !");
					}
				}
			});
		}
		else{
			response.error_message = "#1 You need to report something";
			response.error = true;
			client.emit('report_response', response);
		}		
	});
	
	client.on('disconnect', function(){
		console.log('user disconnected, deleting...');
		if(users[client.id]){
			tempDiscName = users[client.id].name;
			delete users[client.id];
			for(var clientID in users){
				io.to(clientID).emit('update_message', "<strong>" + tempDiscName + "</strong> just left the Game");
			}		
			updateUserTable();
			console.log('successfull deleted user');
			console.log(users);				
		}
		else{
			console.log('what just happened?');
		}			
	});		
 });
	

function sentCurrentPreview(clientID){
	var time_left = 30- (Math.floor(Date.now() / 1000) - intervalStartTime);
	io.to(clientID).emit('new_song', {"preview": currentSongPreview, "time_left" : time_left});
}
function loadNewSong(){		
 console.log("in loadNewSong");	
		con.query('SELECT id,  preview, song_name_short, artist, artist_image FROM ?? ORDER BY RAND() LIMIT 1', ['mq_songs'], function(err, result) {
			if (err) throw err;				 

			lastSongPreview = currentSongPreview;
			lastSongID = currentSongID;			
			lastSongArtist = currentSongArtist;
			lastSongName = currentSongName;	
			lastSongImage = currentSongImage;


			currentSongPreview = result[0].preview;
			currentSongID = result[0].id;		
			currentSongArtist = result[0].artist; 
			currentSongName = result[0].song_name_short;		
			currentSongImage = result[0].artist_image;				 

			console.log('preview: ', currentSongPreview);
			
			var counter = 0;
			
			for(var clientID in users){					
				console.log(clientID);				
				io.to(clientID).emit('new_song', {"preview": currentSongPreview, "currentSongID" : currentSongID , "time_left" : 30});	
				if(lastSongID != 0){
					update_last_song(clientID);
				}
				// reset guess booleans
				users[clientID].artist = false;
				users[clientID].song = false;
				counter++;
			}
			console.log(counter + ' users in game');
		});	
		intervalStartTime = Math.floor(Date.now() / 1000);		
} 
   
function update_last_song(clientID){
	if(lastSongID != 0){
		var infoArray = {};
		infoArray = {"id" : lastSongID, "artist" : lastSongArtist, "songname" : lastSongName, "image" : lastSongImage};
		io.to(clientID).emit('update_last_song', infoArray);
	}	
}
   
function updateUserTable(){	 
	var userArray = {};
	var counter = 0;					
	for(var clientID in users){
		userArray[counter] = {"name": users[clientID].name,"points":  users[clientID].points};			
		counter++;
	}	
	for(var clientID in users){				
		io.to(clientID).emit('update_table', userArray);
	}
	console.log("updating table");
}
   console.log("starting interval");
 var job = new CronJob('*/30 * * * * *', loadNewSong, false); 
 console.log("starting interval"); 
 job.start();


// launch ======================================================================
server.listen(3000, function(){
  console.log('listening on *:3000');
});
