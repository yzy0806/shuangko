module.exports=function(io,rooms){

	function findRoom(roomId){
	for(var i=0;i<rooms.length;i++){
		if(rooms[i].roomNumber==roomId){
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
			socket.broadcast.emit('playerUpdate',JSON.stringify(room));
			socket.emit('playerUpdate',JSON.stringify(room));
		})
	})

	var games = io.of('/games').on('connection',function(socket){
		console.log('games connection server');

		socket.on('joinRoom',function(data){
			socket.join(data.roomNumber);
		});
	})
}