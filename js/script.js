//APIキー
var APIKEY = '6165842a-5c0d-11e3-b514-75d3313b9d05';
// var APIKEY = '84db5394-8d3b-11e3-ab66-e500405b4002';

// ユーザ名をランダムに生成
var userName = 'guest' + Math.floor(Math.random() * 100);

//ユーザーリスト
var userList = [];
var chatList = [];

// PeerJSオブジェクトを生成
var peer = new Peer(userName,{ key: APIKEY});
// var peer = new Peer({ key: APIKEY, debug: 3});

// PeerJS data connection object
var peerConn;



// PeerIDを生成
peer.on('open', function(){
    $('#my-id').text(peer.id);
    getUserList();
});

peer.on('connection', function(conn){
	dataChannelEvent(conn);
});


function getUserList () {
    //ユーザリストを取得
    $.get('https://skyway.io/active/list/'+APIKEY,
        function(list){
            for(var cnt = 0;cnt < list.length;cnt++){
                if($.inArray(list[cnt],userList)<0 && list[cnt] != peer.id){
                    userList.push(list[cnt]);
                    $('#contactlist').append($('<option>', {"value":list[cnt],"text":list[cnt]}));
                }
            }
        }
    );
}

function connect(peerid){
    var conn = peer.connect( $('#contactlist').val(), {"serialization": "json"} );
    dataChannelEvent(conn);
}


function sendMsg(type, message) {
	var data = {
		type: type,
		user: userName,
		text: message
	}
	peerConn.send(data);
}

function dataChannelEvent(conn){
	peerConn = conn;
	peerConn.on('data', function(data){
		console.log(data);
		if(data.type == 'sound'){
			console.log("make sound!");
		} else if (data.type == 'chat'){

		} else if (data.type == 'info'){
			if(data.text == 'hello'){
				console.log(data.user);
			}
		}
	});
}


// イベントハンドラー
$(function(){

    $('#make-connection').click(function(event) {
        connect($('#contactlist').val());
    });

    $('#beep').click(function(event) {
        sendMsg('sound', 'beep!');
    });

    //ユーザリスト取得開始
    setInterval(getUserList, 2000);

});