module.exports=function(io,rooms,users){
var util = require('util');

	function findRoom(roomId){
	for(var i=0;i<rooms.length;i++){
		if(rooms[i].roomNumber===roomId){
			return rooms[i];
			}
		}
	}

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

	var gamerooms=io.of('/roomlist').on('connection',function(socket){
		socket.emit('roomUpdate',JSON.stringify(rooms));
		socket.on("newRoom", function(data){
			rooms.push(data);
			socket.broadcast.emit('roomUpdate',JSON.stringify(rooms));
			socket.emit('roomUpdate',JSON.stringify(rooms));
		})

		socket.on("updatePlayer",function(data){
			var room =findRoom(data.roomNumber);
			room.playerList=data.playerList;
			socket.broadcast.emit('roomUpdate',JSON.stringify(rooms));
			socket.emit('roomUpdate',JSON.stringify(rooms));
		})
	})

	var games = io.of('/games').on('connection',function(socket){

		socket.on('connectRoom',function(data){
			socket.join(data.roomNumber);
			UpdateUserList(data.roomNumber);
		});

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



		socket.on("leaveGame",function(data){
			console.log("leave");
			socket.leave(data.roomNumber);
			UpdateUserList(data.roomNumber);
		});

		function UpdateUserList(room){
			var index=room+"";
			var clients =io.nsps['/games'].adapter.rooms[room];
			if(clients!==undefined &&users[index]!==undefined){
			clients=Object.getOwnPropertyNames(clients);
			var clientList=[];
			var roomMember=users[index]["players"];
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

		socket.on('startGame',function(data){
			//14 =A, 15=2, 16=smallJoker, 17=largeJoker
			var team1=[];
			var team2=[];
			for (var i=0;i<users[data.roomNumber]["players"].length;i++){
				if(users[data.roomNumber]["players"][i]["player"]["team"]==="team1"){
					team1.push(users[data.roomNumber]["players"][i]);
				}
				else{
					team2.push(users[data.roomNumber]["players"][i]);
				}
			}
			var team=[];
			team[0]=team1[0];
			team[1]=team2[0];
			team[2]=team1[1];
			team[3]=team2[1];
			users[data.roomNumber]["players"]=team;
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
			cards.shuffle();
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
		var initialIndex=Math.floor((Math.random() * 4));
		users[data.roomNumber]["counter"]=initialIndex;
		var id=users[data.roomNumber]["players"][initialIndex]["id"];
		socket.to(data.roomNumber).emit('distributeCards',{cards:[],id:id,cardsOwner:id});
		socket.emit('distributeCards',{cards:[],id:id,cardsOwner:id});

		});

	    socket.on("sendCards",function(data){
	    	users[data.roomNumber]["counter"]++;
	    	var index=users[data.roomNumber]["counter"]%4
	    	data.id=users[data.roomNumber]["players"][index].id;
	    	socket.to(data.roomNumber).emit('distributeCards',data);
	    	socket.emit('distributeCards',data);
	    })
	})
}