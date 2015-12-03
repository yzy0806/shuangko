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
}