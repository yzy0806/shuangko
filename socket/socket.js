module.exports=function(io,rooms){

	function findRoom(roomId){
	for(var i=0;i<rooms.length;i++){
		if(rooms[i].roomNumber===roomId){
			return rooms[i];
			}
		}
	}


	var gamerooms=io.of('/roomlist').on('connection',function(socket){
		socket.emit('roomUpdate',JSON.stringify(rooms));
		socket.on("newRoom", function(data){
			rooms.push(data);
			socket.broadcast.emit('roomUpdate',JSON.stringify(rooms));
			socket.emit('roomUpdate',JSON.stringify(rooms));
		})

		socket.on("addPlayer",function(data){
			var room =findRoom(data.roomNumber);
			room.playerList.push(data.player);
			room.teams[data.player.team].push(data.player.name);
			socket.broadcast.emit('roomUpdate',JSON.stringify(rooms));
			socket.emit('roomUpdate',JSON.stringify(rooms));

		})
	})

	var games = io.of('/games').on('connection',function(socket){
		console.log('games connection server');

		var users={}

		socket.on('joinRoom',function(data){
			var user={};
			user.id=socket.id;
			user.player=data.player;
			if(users[data.roomNumber]!==undefined){
				users[data.roomNumber].push(user);
			}
			else{
				users[data.roomNumber]=[];
				users[data.roomNumber].push(user);
			}
			console.log(users);
			socket.join(data.roomNumber);
		});


		function UpdateUserList(room){
			var clients =io.nsps['/games'].adapter.rooms[room];
			if(clients!==undefined){
			clients=JSON.stringify(clients).getOwnPropertyNames();
			console.log(clients);
			var clientList=[];
			for (client in clients){
				for (user in users[room]){
					if(client===user.id){
						clientList.push(client);
					}
				}
			}
			users[room]=clientList;
			socket.to(room).emit(clientList);
			}
			
		}

		socket.on('updateList',function(data){
			UpdateUserList(data.roomNumber);
		})
	})
}