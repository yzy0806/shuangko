module.exports=function(io,rooms,users){
var util = require('util');

//find the game room given the room id
	function findRoom(roomId){
	for(var i=0;i<rooms.length;i++){
		if(rooms[i].roomNumber===roomId){
			return rooms[i];
			}
		}
	}

//shuffle the card deck, so each player will have different cards

	Array.prototype.shuffle = function() {
	  var i = this.length, j, temp;
	  if ( i == 0 ) return this;
	  while ( --i ) {
	     j = Math.floor( Math.random() * ( i + 1 ) );
	     temp = this[i];
	     this[i] = this[j];
	     this[j] = temp;
	  }
	  return this;
	}

//create a name space called roomlist to store all the rooms.
	var gamerooms=io.of('/roomlist').on('connection',function(socket){
		socket.emit('roomUpdate',JSON.stringify(rooms));
		socket.on("newRoom", function(data){
			//when a new room is created, update the pages. 
			rooms.push(data);
			socket.broadcast.emit('roomUpdate',JSON.stringify(rooms));
			socket.emit('roomUpdate',JSON.stringify(rooms));
		})

		socket.on("updatePlayer",function(data){
			//when a new player is added to a room, modify the number of players in the room.
			var room =findRoom(data.roomNumber);
			room.playerList=data.playerList;
			socket.broadcast.emit('roomUpdate',JSON.stringify(rooms));
			socket.emit('roomUpdate',JSON.stringify(rooms));
		})
	})

//create a name space called games to let the users
//to play game
	var games = io.of('/games').on('connection',function(socket){
		socket.on('connectRoom',function(data){
			//when a person open the webpage, give the client the current players.
			socket.join(data.roomNumber);
			UpdateUserList(data.roomNumber);
		});
		//when a user join a room, add the user info to the room obejct
		//if there is no room obejct, create one
		socket.on('joinRoom',function(data){
			var user={};
			user.id=socket.id;
			user.player=data.player;
			var index=data.roomNumber;
			if(users[index]!==undefined){
				users[index]["players"].push(user);
			}
			else{
				users[index]={};
				users[index]["players"]=[];
				users[index]["players"].push(user);
			}
			UpdateUserList(data.roomNumber);
		});

		//handle the leave room or disconnect.
		socket.on("leaveGame",function(data){
			socket.leave(data.roomNumber);
			UpdateUserList(data.roomNumber);
		});

		//helper function to update user list for a given room
		function UpdateUserList(room){
			var index=room+"";
			var clients =io.nsps['/games'].adapter.rooms[room];
			if(clients!==undefined &&users[index]!==undefined){
			clients=Object.getOwnPropertyNames(clients);
			var clientList=[];
			var roomMember=users[index]["players"];
			//check the live connections against the room object 
			for (var i in roomMember){
				for (var k in clients){
					if(clients[k]===roomMember[i].id){
						clientList.push(roomMember[i]);
					}
				}
			}
			users[index]["players"]=clientList;
			users[index]["counter"]=users[index]["counter"];
			socket.emit('updateClientList',users[index]["players"]);
			socket.to(room).emit('updateClientList',users[index]["players"]);
			}
		};

		//adjust players based on the team, shuffle cards and ditribute cards to players
		socket.on('startGame',function(data){
			//14 =A, 15=2, 16=smallJoker, 17=largeJoker
			var team1=[];
			var team2=[];
			//adjust the player sequece based on the team
			for (var i=0;i<users[data.roomNumber]["players"].length;i++){
				if(users[data.roomNumber]["players"][i]["player"]["team"]==="team1"){
					team1.push(users[data.roomNumber]["players"][i]);
				}
				else{
					team2.push(users[data.roomNumber]["players"][i]);
				}
			}
			socket.to(data.roomNumber).emit('teams',{team1:team1,team2:team2});
			socket.emit('teams',{team1:team1,team2:team2});
			var team=[];
			team[0]=team1[0];
			team[1]=team2[0];
			team[2]=team1[1];
			team[3]=team2[1];
			users[data.roomNumber]["players"]=team;
			UpdateUserList(data.roomNumber);
			//create the card deck 
			var cards=[];
			for(var i=3;i<16;i++){
				for(var k=0;k<4;k++){
					var c1= i+String.fromCharCode(65+k);
					var c2= i+String.fromCharCode(65+k);
					cards.push(c1);
					cards.push(c2);
				}
			}
			cards.push('16A');
			cards.push('16A');
			cards.push('17A');
			cards.push('17A');
			//shuffle the card deck.
			cards.shuffle();
			
			//distribute the card to each players 
			for (var i=0;i<4;i++){
				var hand =cards.slice(i*27, (i+1)*27);
				hand = hand.sort(function (a, b) { 
    				return parseInt(a.slice(0, -1), 10)-parseInt(b.slice(0, -1), 10);
				});
				if(i===3){
					socket.emit('initiateHand', hand);
				}
				socket.broadcast.to(data.playerList[i].id).emit('initiateHand', hand);
			}
		//set up the counter to keep track of whose turn is this
		var initialIndex=Math.floor((Math.random() * 4));
		users[data.roomNumber]["counter"]=initialIndex;
		var id=users[data.roomNumber]["players"][initialIndex]["id"];
		socket.to(data.roomNumber).emit('distributeCards',{cards:[],id:id,cardsOwner:id});
		socket.emit('distributeCards',{cards:[],id:id,cardsOwner:id});
		});
		
		//count the remian cards 
		socket.on("cardCount",function(data){
			socket.to(data.roomNumber).emit('remainCards',data);
	    	socket.emit('remainCards',data);
		});

		//send cards to players
	    socket.on("sendCards",function(data){
	    	users[data.roomNumber]["counter"]++;
	    	var index=users[data.roomNumber]["counter"]%4
	    	data.id=users[data.roomNumber]["players"][index].id;
	    	socket.to(data.roomNumber).emit('distributeCards',data);
	    	socket.emit('distributeCards',data);
	    });

	    //skip a player, if they have send all the cards 
	    socket.on("skipPlayer",function(data){
	    	users[data.roomNumber]["counter"]=users[data.roomNumber]["counter"]+2;
	    	var index=users[data.roomNumber]["counter"]%4;
	    	data.id=users[data.roomNumber]["players"][index].id;
	    	data.cardsOwner=users[data.roomNumber]["players"][index].id;
	    	data.cards=[];
	    	socket.to(data.roomNumber).emit('distributeCards',data);
	    	socket.emit('distributeCards',data);
	    });

	    //handle when a user send all the cards
	    socket.on("cardsFinished",function(data){
	    	socket.to(data.roomNumber).emit('addRank',data);
	    	socket.emit('addRank',data);
	    });

	    //keep track of winners
	    socket.on("updateWinner",function(data){
	    	socket.to(data.roomNumber).emit('teamWinner',data);
	    	socket.emit('teamWinner',data);
	    });

	    //broadcast the game over event.
	    socket.on("gameover",function(data){
	    	socket.to(data.roomNumber).emit('restart',data);
	    	socket.emit('restart',data);
	    });
	})
}