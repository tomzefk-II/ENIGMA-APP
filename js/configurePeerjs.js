var peer = new Peer();
let conn;
makeConnectionToPeer = function(id){
  conn = peer.connect(id);
}
// on open will be launch when you successfully connect to PeerServer
conn.on('open', function(){

  conn.send('hi!');
});

peer.on('connection', function(conn) {
  conn.on('data', function(data){
    // Will print 'hi!'
    console.log(data);
  });
});
