module.exports=function(io,rooms){
	var gamerooms=io.of('/roomlist').on('connection',function(socket){
		socket.emit('roomUpdate',JSON.stringify(rooms));
		console.log("on server estabed");
		socket.on("newRoom", function(data){
			rooms.push(data);
			socket.broadcast.emit('roomUpdate',JSON.stringify(rooms));
			socket.emit('roomUpdate',JSON.stringify(rooms));
		})
		
	})

	var games = io.of('/games').on('connection',function(socket){
		console.log('games connection server');

		socket.on('joinRoom',function(data){
			socket.join(data.roomNumber);
		});
	})
}