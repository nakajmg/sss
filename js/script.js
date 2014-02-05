/**
 * Created by yusuke on 2013/12/20.
 */

//APIキー
var APIKEY = '6165842a-5c0d-11e3-b514-75d3313b9d05';
// var APIKEY = '84db5394-8d3b-11e3-ab66-e500405b4002';

//ユーザーリスト
var userList = [];

var myid;
// ユーザ名をランダムに生成
var userName = 'ゲスト' + Math.floor(Math.random() * 100);

// Compatibility
navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
window.URL = window.URL || window.webkitURL || window.mozURL || window.msURL;
window.AudioContext = window.AudioContext || window.webkitAudioContext || window.mozAudioContext || window.msAudioContext;

// var frequencyContext = frequencyElement.getContext("2d");

// PeerJSオブジェクトを生成
var peer = new Peer({ key: APIKEY, debug: 3});

// PeerJS data connection object
var peerConn;

// PeerIDを生成
peer.on('open', function(){
    $('#my-id').text(peer.id);
    myid = peer.id;
    $("#history").prepend('<span class="info">your name is ' + userName + ' and PeerID is ' + myid + '</span><br>' );
});

peer.on('connection', dataChannelEvent);

function connect(peerid){
    if(!peerid){
        peerid = $('#contactlist').val();
    }

    var conn = peer.connect( $('#contactlist').val(), {"serialization": "json"} );
    $("#history").prepend('<span class="info">you are connecting to ' + peerid + '</span><br>' );
    sendMsg('info', 'connecting');
    dataChannelEvent(conn);

}

function dataChannelEvent(conn){
    peerConn = conn;
    peerConn.on('data',function(data){
        console.log(data);

        if(data.type == 'chat'){
            $("#history").prepend( '<span class="chat">' + data.name + ' : ' + data.text + '</span><br>' );
        }else if(data.type == 'sound'){
            $("#history").prepend('<span class="sound">' + data.name + ' : ' + data.text + '</span><br>' );
        }else if(data.type == 'info'){
            if(data.text == 'connecting') {
                $("#history").prepend('<span class="info">you are connecting to ' + data.user + '</span><br>' );
            }
        }
        

    });
    peerConn.on('close', function(err){
        console.log(err);
    });
    peerConn.on('error', function(err){
        console.log('failed to connect' + err);
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

function sendMsg(type, message) {
    var data = {
        type: type,
        user: myid,
        name: userName,
        text: message
    };
    peerConn.send(data);
}

$('#message').keypress( function ( e ) {
    if ( e.which == 13 ) {
        $("#history").prepend( '<span class="chat">you : ' + $("#message").val() + '</span><br>' );
        sendMsg('chat', $("#message").val());
        $("#message").val("");
    }
} );
    