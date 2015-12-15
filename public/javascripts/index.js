  var socket = io.connect("http://finalproject-leoying.rhcloud.com:8000/roomlist");
  socket.on("connect",function(){});

  $("#addroom").click(function(){
    var roomName=$("#roomname").val();
    if(roomName!=''){
      var roomNumber= parseInt(Math.random()*100000)+"";
      var playerList=[];
      socket.emit('newRoom',{roomName:roomName, roomNumber:roomNumber, playerList:playerList});
    }
  });

  socket.on("roomUpdate",function(data){
    $("#roomList").html("");
    var procData=JSON.parse(data);
    for (var i =0;i<procData.length;i++){
      var str='<a href=room/'+procData[i].roomNumber +'><li>' +procData[i].roomName + procData[i].playerList.length+'</li></a>'
      $("#roomList").prepend(str);
    }
  })