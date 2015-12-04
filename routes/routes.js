var rooms;
exports.init = function(app,roomList) {
  app.get('/', index); // essentially the app welcome page
  app.get('/room/:id',room);
  rooms=roomList;
}
// No path:  display instructions for use
index = function(req, res) {
  res.render('help');
};

room=function(req, res, next){
	var room = findRoom(req.params.id);
	console.log(room);
	res.render('room',{room:room});
}

function findRoom(roomId){
	for(var i=0;i<rooms.length;i++){
		if(rooms[i].roomNumber==roomId){
			return rooms[i];
		}
	}
}