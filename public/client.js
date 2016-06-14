function show_login_screen(){
	$('#login_body').show();
	$('#game').hide();
}

function show_game_screen(){
	$('#login_body').hide();
	$('#game').show();
}	
	
		
function set_username(){
			username = $('#username').val();						
			socket.emit('addUser', username);
			$('#username').val('');				
	}
	
	
	
	
	socket.on('login_confirmation', function(data){
		if(!data.error){
			show_game_screen();
			$('#userspan').html(data.name);			
		}
		else{
			show_login_screen();
			$('#error_message').empty();
			$('#error_message').text("error joining the game");
		}		
	});	
	
	socket.on('update_message', function(msg){
		var date = new Date;
		var minutes = date.getMinutes();
		var hours = date.getHours();		
		$("<li><span style='font-size:12px;margin-right:5px'>" + hours + ":" + minutes + "</span> " + msg + "</li>").hide().prependTo("#event_list").fadeIn("600");
	});	
	
		
	socket.on('update_last_song', function(infoArray){		
		window.lastSongID = infoArray.id;				
		$('#correct_artist').html(infoArray.artist);	
		$('#correct_song_name').html(infoArray.songname); 
		$('#correct_image').attr("src", infoArray.image);
	});	
	
	socket.on('new_song', function(data){
		window.time_left = data.time_left;
		window.currentSongID = data.currentSongID;
		$('#artist_guess').removeAttr('disabled');
		$('#song_guess').removeAttr('disabled');			  
		$('#artist_guess').attr('placeholder', 'artist');
		$('#song_guess').attr('placeholder', 'Song name');	
		$('#h5_player')[0].pause();		
	    $('#music_source').attr("src", data.preview);		
		$('#h5_player')[0].load();					 		
		$('#h5_player')[0].play();		
	});	

  socket.on("update_table", function(data){
		//var peopleOnline = [];	
		table_string = "";		
		jQuery.each(data, function(counter, info) {		
			 table_string = table_string + "<tr style='font-weight:bold'><td>"+ (parseInt(counter) + 1) + "</td><td>" + info.name + " </td><td>" + info.points +"</td></tr>";		
		});
		$('#user_table tbody').html(table_string).show(200);
	
	 });	
	
	
	
	
function submit(){
	if($('#artist_guess').val() == "" && $('#song_guess').val() == ""){
		$('#wrong').html("no input");
		$('#wrong').show(200);	
		setTimeout(function(){   $('#wrong').hide(300); }, 3500);	
	}else{	
		guess = {};
		artist_guess = $('#artist_guess').val();	
		songname_guess = $('#song_guess').val();	
		$('#artist_guess').val('');
		$('#song_guess').val('');
		guess = {"artist_guess" : artist_guess, "songname_guess": songname_guess};
		socket.emit('guess', guess);
	}				
}		

		
	socket.on('guess_response', function(response){
		if(response.points_gained < 1){	
			if(response.artist == false && response.song == false){			
				alert_string = 	"<strong>Nope!</strong> Try your luck again";					
			}
			else if(response.artist == true && response.song == true){	
				alert_string = 	"You already guessed both correct";				
			}
			$('#wrong').html(alert_string);
			$('#wrong').show(200);	
			setTimeout(function(){   $('#wrong').hide(300); }, 3500);	
		}
		else{
			if(response.artist == true && response.song == true){					
				alert_string = "<strong>DAYUM!</strong> You got <strong>artist & SONG NAME</strong> right. <b>(+" + response.points_gained + ")</b>";							
				$('#artist_guess').attr('disabled', 'disabled');
				$('#artist_guess').attr('placeholder', 'got it');
				
				$('#song_guess').attr('disabled', 'disabled');
				$('#song_guess').attr('placeholder', 'got it');				
			}
			else if(response.artist == true && response.song == false){
				alert_string = "<strong>Well done!</strong> You got the  <strong>Artist </strong> right. <b>(+" + response.points_gained + ")</b>";	
				$('#song_guess').focus();
				$('#song_guess').select();				 
				$('#artist_guess').attr('disabled', 'disabled');
				$('#artist_guess').attr('placeholder', 'got it');
			}
			else if(response.artist == false && response.song == true){
				alert_string = "<strong>Well done!</strong> You guessed the <strong>SONG NAME </strong> correctly. <b>(+" + response.points_gained + ")</b>";	
				$('#artist_guess').focus();
				$('#artist_guess').select();				 
				$('#song_guess').attr('disabled', 'disabled');
				$('#song_guess').attr('placeholder', 'got it');
			}
			$('#correct').html(alert_string);
			$('#correct').show(200);	
			setTimeout(function(){   $('#correct').hide(300); }, 3500);				  
		}
	});	
	
	
		socket.on('change_username_response', function(response){
			if(!response.error){
				$('#userspan').html(response.new_username);
			    $('#change_username_wrap').html("<div class='msgAfterSubmit green'>Successfully change your username to " + response.new_username + "</div>"); 
			}
			else{
				$('#change_username_wrap').html("<div class='msgAfterSubmit red'>" + response.error_message + "</div>");   
			}
		});
	
	
	function change_username_messi(){
		new Messi(   
		'<div id ="change_username_wrap" style="padding:20px;">New username: <input class="form-control" type="text"  id="new_username" style="margin-bottom:40px;"><br>'+  
		'<div id="loading"><input type="button" class ="btn btn-lg btn-primary btn-block" style="display:block;margin-right:auto;margin-left:auto" value="Submit" onclick="change_username();"></div></div>', 
		{title: 'CHANGE PROFILE', titleClass: '', modal: true});  
		$('.messi-modal').click(function() {				
			$('.messi').remove();
			$('.messi-modal').remove();
		});
		$('#new_username').bind("enterKey",function(e){
			change_username();
		});
		$('#new_username').keyup(function(e){
			if(e.keyCode == 13){
				$(this).trigger("enterKey");
			}
		});	
	};


	function change_username(){
		var new_username = $('#new_username').val();
		
		if(new_username != ""){
			socket.emit('change_username', new_username);
		}else{
			$('#change_username_wrap').html("<div class='msgAfterSubmit red'>Empty field</div>");
		}		
	}
	
	
	
	
	
	
function getCookie(cname) {
	var name = cname + "=";
	var ca = document.cookie.split(';');
	for(var i=0; i<ca.length; i++) {
		var c = ca[i];
		while (c.charAt(0)==' ') c = c.substring(1);
		if (c.indexOf(name) == 0) {
			return c.substring(name.length, c.length);
		}
	}
	return "";
}  





function mute(){
	if(window.muted == true){
		$('#muteButton span').attr("class", "glyphicon glyphicon-volume-up");	
		window.muted = false;	
		volume = window.unmute_volume == 0 ? 0.2 : window.unmute_volume;
			
	}
	else{
		$('#muteButton span').attr("class", "glyphicon glyphicon-volume-off");	
		window.muted = true;
		volume = 0;
	}
	$('#volumeBar').css({background:"hsla(230,"+ volume*100 +"%,50%,0.7)"});
	$('#h5_player')[0].volume = volume;		 
	document.cookie = "volume = " + volume; 
	$('#volumeBar').slider( {
	value : volume*100});		
}


	
$(document).ready(function() {	
	
	show_login_screen();		
	volume = getCookie("volume");
	 
	if(volume == ""){
		volume  = 0.3;
		document.cookie = "volume = " +  volume ; 
	}
	$('#h5_player')[0].volume = volume;
	
	if(muted == false  && volume == 0){
		 window.muted = true;		
		 $('#muteButton span').attr("class", "glyphicon glyphicon-volume-off");			 
	}	
	 
	$('#volumeBar').css({background:"hsla(220,"+volume*100+"%,50%,0.7)"});	
	window.unmute_volume = volume; 	
	$('#volumeBar').slider( {
		value : volume*100,
		slide : function(ev, ui) {			
			 $('#volumeBar').css({background:"hsla(220,"+ui.value+"%,50%,0.7)"});	 
			 $('#h5_player')[0].volume = ui.value/100; 
			 document.cookie = "volume = " +  ui.value/100 ; 
			 window.unmute_volume = ui.value/100 ; 	
			 if(window.muted == true && ui.value/100 > 0){
				 window.muted = false;
				 $('#muteButton span').attr("class", "glyphicon glyphicon-volume-up");			 
			 }
		 } 
	});

	
	$('#volumeBar a').css("cursor", "pointer");
	$('#volumeBar a').css("outline", "none");
	
	window.setInterval(function(){
		if(window.time_left > 0){
			window.time_left -= 1;
			$('.progress-bar').attr("aria-valuenow", 100-(window.time_left / 30) *100);					
			$('.progress-bar').css("width", 100-(window.time_left / 30) *100 + "%") ;	
			$('#timeLeftText').html(window.time_left +"s");	
		}
	},1000);
	
	
	$('#artist_guess').bind("enterKey",function(e){
		submit();
	});
	$('#artist_guess').keyup(function(e){
		if(e.keyCode == 13){
			$(this).trigger("enterKey");
		}
	});


	$('#song_guess').bind("enterKey",function(e){
		submit();
	});
	$('#song_guess').keyup(function(e){
		if(e.keyCode == 13){
			$(this).trigger("enterKey");
		}
	});	
	
$('#correctTextWrap').click(function (){
			window.save_song_id = window.lastSongID;
					new Messi(   
				'<h4>Case sensitivity and whitespaces dont matter</h4><br><b>Artist: </b><br><div id="possibleArtists"></div><input type="button" class ="btn btn-lg btn-primary btn-block" value="SUBMIT AN ARTIST OPTION" onclick="submit_artist_option();">'+  
				'<br><b>Song Name: </b><br><div id="possibleSongnames"></div><input type="button" value="SUBMIT A SONG NAME OPTION" class ="btn btn-lg btn-primary btn-block" onclick="submit_songname_option();">'+
				'<div class="allUnchecked red"></div>', 
			{title: 'All possible answers', titleClass: '', modal: true}); 
			
			
			$('.messi-modal').click(function() {
				
					$('.messi').remove();
					$('.messi-modal').remove();

			});
			
			updateOptions();
		});	
	$('#correct_image').click(function(){
			window.temp_song_id = window.lastSongID;
			new Messi(   
				'Song: <b>' + $('#correct_artist').text() + '</b><br> Artist: <b>' + $('#correct_song_name').text() + '</b><br><br><div id="wrap22">' +
				'<div class="checkbox" >  <label>		<input id="adjustAnswers" type="checkbox" name="adjustAnswers"><b>[AdjustAnswers]</b> Adjust correct answers / add more. (no one could guess the current one) </label><br>'+
				'<label><input id="playbackProblem" type="checkbox" name="playbackProblem">	<b>[Playback problem]</b> Song did not get played. </label><br>'+
				' <label>	<input  id="badSong" type="checkbox" name="badSong">	<b>[Bad Song]</b> Bad Song in general, very niche. </label><br>'+
				'<label><input id="notDisplayed" type="checkbox" name="notDisplayed">  <b>[Not Displayed]</b>  Picture or correct result did not get displayed. </label>'+	
				'</div><br>'+  
				'<div id="loading"><input type="button" class ="btn btn-lg btn-primary btn-block" style="display:block;margin-right:auto;margin-left:auto" value="Submit" onclick="report();"></div></div><div class="allUnchecked red"></div>', 
			{title: 'Report problem', titleClass: '', modal: true}); 
			
			$('.messi-modal').click(function() {
				
					$('.messi').remove();
					$('.messi-modal').remove();

			});
		});		
	
});
function report(){			
			adjustAnswers = $('#adjustAnswers').is(':checked') === true ? 1 : 0;
			playbackProblem = $('#playbackProblem').is(':checked') === true ? 1 : 0;
			badSong = $('#badSong').is(':checked') === true ? 1 : 0;
			notDisplayed = $('#notDisplayed').is(':checked') === true ? 1 : 0;			
			
			if(adjustAnswers == 0 && playbackProblem == 0 && badSong == 0 && notDisplayed == 0){		
				$('.allUnchecked').html("Need to check atleast one...");
			}
			 else{ 			
			    socket.emit('report', {"song_id" : window.temp_song_id, "adjustAnswers" : adjustAnswers, "playbackProblem" : playbackProblem, "badSong" : badSong, "notDisplayed" : notDisplayed});	
			}			
}

socket.on('report_response', function(response){				   
   if(!response.error){
	  $('.allUnchecked').html('');
	  $('#wrap22').html("<div class='msgAfterSubmit green'>Successfully reported the song with id: " + response.song_id + " for " + response.reasons +"</div>"); 
   }
   else{
	  $('.allUnchecked').html('');
	  $('#wrap22').html("<div class='msgAfterSubmit red'>" + response.error_message + "</div>");   
   }				
});			
				
				
				
				
				
				

function submit_artist_option(){					
	new Messi(   
	'<div id="wrap23" style="padding:30px"><input type="text" id="user_artist_option" class="form-control" style="margin-right:20px;"><input type="button" id="submit_artist_option" class ="btn btn-lg btn-primary btn-block" value="Add" onclick="send_new_artist_option();" style="margin-top:20px;"></div><div class="allUnchecked red submitOption"></div>', 
	{title: 'Add a new artist option', titleClass: '', modal: true}); 
}

function submit_songname_option(){
	new Messi(   
	'<div id="wrap23" style="padding:30px"><input type="text" id="user_songname_option"  class="form-control" style="margin-right:20px;"><input type="button"id="submit_songname_option" class ="btn btn-lg btn-primary btn-block" value="Add" onclick="send_new_songname_option();" style="margin-top:20px;"></div><div class="allUnchecked red submitOption"></div>', 
	{title: 'Add a new song name option', titleClass: '', modal: true}); 					
}

function updateOptions(){
	if(window.save_song_id !== undefined && window.save_song_id > 0){
		socket.emit('update_correct_answers', window.save_song_id);
	}	
}

socket.on('update_correct_answers', function(response){
	if(!response.error){
		$('#possibleArtists').html('');
		$('#possibleSongnames').html('');
		for(var i in response.artists){
			$('.allUnchecked').html('');
			$('#possibleArtists').append( "<span id='artist_votes" + response.artists[i].id + "' style='width:50px'>" + response.artists[i].votes + "</span> " + response.artists[i].name + '<input type="button" id="artist_upvote' + response.artists[i].id +'" class ="btn btn-lg btn-success" value="Up" onclick="upvote_artist_answer('+ response.artists[i].id +');" style="line-height: 15px; margin-left: 10px; margin-bottom: 5px;">'+
			'<input type="button" id="artist_downvote' + response.artists[i].id +'" class ="btn btn-lg btn-danger" value="Down" onclick="downvote_artist_answer('+ response.artists[i].id +');" style="line-height: 15px; margin-left: 10px; margin-bottom: 5px;"><br>'); 
		}	
		for(var i in response.songnames){
			$('.allUnchecked').html('');
			$('#possibleSongnames').append( "<span id='song_votes" + response.songnames[i].id + "' style='width:50px'>" + response.songnames[i].votes + "</span> " + response.songnames[i].name + '<input type="button" id="song_upvote' + response.songnames[i].id +'" class ="btn btn-lg btn-success" value="Up" onclick="upvote_songname_answer('+ response.songnames[i].id +');" style="line-height: 15px; margin-left: 10px; margin-bottom: 5px;">' +
			 '<input type="button" id="song_downvote' + response.artists[i].id +'" class ="btn btn-lg btn-danger" value="Down" onclick="downvote_songname_answer('+ response.artists[i].id +');" style="line-height: 15px; margin-left: 10px; margin-bottom: 5px;"><br>'); 
		}				 
	}
	else{
		$('.allUnchecked').html('');
		$('.allUnchecked').html("<div class='msgAfterSubmit red'>" + response.error_message + "</div>");   
	}			
});

function upvote_songname_answer(id){
	socket.emit('upvote_songname_answer', {"id" : id, "vote" : 1});
}

function upvote_artist_answer(id){
	socket.emit('upvote_artist_answer', {"id" : id, "vote" : 1});	
}

function downvote_songname_answer(id){
	socket.emit('upvote_songname_answer', {"id" : id, "vote" : -1});
}

function downvote_artist_answer(id){
	socket.emit('upvote_artist_answer', {"id" : id, "vote" : -1});	
}

socket.on('upvote_songname_response', function(response){
	if(!response.error){
		id = response.id;
		votes = parseInt($('#song_votes' + id).html().replace( /^\D+/g, ''));
		if(response.upvoted)votes++;
			else votes--;				
		$('#song_votes' + id).html(votes);
		$('#song_upvote' + id).remove();	
		$('#song_downvote' + id).remove();		
	}
	else{
		$('.allUnchecked').html('');
		$('.allUnchecked').html("<div class='msgAfterSubmit red'>" + response.error_message + "</div>");   	
	}
});

socket.on('upvote_artist_response', function(response){
	if(!response.error){
		id = response.id;
		votes = parseInt($('#artist_votes' + id).html().replace( /^\D+/g, ''));
		if(response.upvoted) votes++;
			else votes--;				
		$('#artist_votes' + id).html(votes);
		$('#artist_upvote' + id).remove();		
		$('#artist_downvote' + id).remove();		
	}
	else{
		$('.allUnchecked').html('');
		$('.allUnchecked').html("<div class='msgAfterSubmit red'>" + response.error_message + "</div>");   	
	}
});



function send_new_artist_option(){
	user_artist_option = $('#user_artist_option').val();
	if(user_artist_option != ""){
		socket.emit('add_new_artist', {"artist" : user_artist_option, "song_id" : window.save_song_id});
	}else{
		$('.submitOption').html('Enter something');
	}
}

function send_new_songname_option(){
	user_songname_option = $('#user_songname_option').val();
	if(user_songname_option != ""){
		socket.emit('add_new_songname', {"songname" : user_songname_option, "song_id" : window.save_song_id});
	}else{
		$('.submitOption').html('Enter something');
	}
}


socket.on('add_new_artist_response', function(response){
	if(!response.error){					
		$('#wrap23').html('<div class="msgAfterSubmit green">"' + response.artist + '" was added to the artist answers!</div>');				 
	}
	else{
		$('#wrap23').html("<div class='msgAfterSubmit red'>ERROR " + response.error_message + "</div>");		
	}	
	updateOptions();				
});					  

socket.on('add_new_songname_response', function(response){
	if(!response.error){					
		$('#wrap23').html('<div class="msgAfterSubmit green">"' + response.songname + '" was added to the songname answers!</div>');				 
	}
	else{
		$('#wrap23').html("<div class='msgAfterSubmit red'>ERROR " + response.error_message + "</div>");		
	}	
	updateOptions();				
});	




			






