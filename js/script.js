
// CONFIG OPTIONS START

var accuracy = 8; // 1 = crotchet, 2 = quaver, 4 = semi-quaver, 8 = demi-semi-quaver
// var bpm = 100; // beats per minute
// var margin = 200; // How many milliseconds to forgive missed beats
// var muted = []; // List muted (silent) instruments

// CONFIG OPTIONS END

// Audio speed settings
var count = 0;
// var bps = bpm / 60; // beats per second
// var interval = (1000 / bps / accuracy) >> 0; // seconds per beat
// var multiplier = interval * accuracy;
// var timer;
// var countdown;
var leadIn = 2000; // Milliseconds to wait for notes to appear

var timer, countdown, bpm, margin, bps, interval, multiplier;
var muted = []; // List muted (silent) instruments

// Difficulty levels
var levels = {
    'easy': {
        bpm: 100, // beats per minute
        margin: 200 // How many milliseconds to forgive missed beats
    },
    'normal': {
        bpm: 120,
        margin: 150
    },
    'hard': {
        bpm: 140,
        margin: 100
    }
}

var currentBeat = {};
var lag = 0; // Time lag across the network
var isSession = false;

// for measurement transfer lag
var HBStartTime;
var lagList = {};

// Compatibility
navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
window.URL = window.URL || window.webkitURL || window.mozURL || window.msURL;
window.AudioContext = window.AudioContext || window.webkitAudioContext || window.mozAudioContext || window.msAudioContext;

// SkyWay API Key for localhost
// var APIKEY = '6165842a-5c0d-11e3-b514-75d3313b9d05';
// SkyWay API Key for mizuman.github.io
// var APIKEY = '84db5394-8d3b-11e3-ab66-e500405b4002';
// SkyWay API Key for http://html5expertshackathon.github.io
var APIKEY = '1e1140a4-9099-11e3-87ef-c90d583d86c3';

// ユーザ名をランダムに生成
// var userName = 'guest' + Math.floor(Math.random() * 100);

// ユーザーリスト
var userList = [];
var chatList = [];
var playerList = [];
var instList = {};
var scores = {};

// PeerJSオブジェクトを生成
var peer = new Peer(userName,{ key: APIKEY});
// var peer = new Peer({ key: APIKEY, debug: 3});

// PeerJS data connection object
var peerConn = [];

// PeerIDを生成
peer.on('open', function(){
    $('#my-id').text(peer.id);
    getUserList();
});

peer.on('connection', function(conn){
	dataChannelEvent(conn);
    makePlayerCard(conn);
});

// エラーハンドラー
peer.on('error', function(err){
    alert(err);
});

function connect(peerid){

    for(var i=0; i<chatList.length && chatList[i] != peerid; i++);

    if(i==chatList.length) {
        var conn = peer.connect( $('#contactlist').val(), {"serialization": "json"} );
        dataChannelEvent(conn);
        $('#session-info').hide();
    }
      

}

// Audio contextを生成
var audioContext = new AudioContext();
var buffers = {};
var instruments = ['bd', 'sd', 'hh', 'cy'];
var req = new XMLHttpRequest();
var loadidx = 0;

// タッチサポートの判定
var SUPPORTS_TOUCH = 'createTouch' in document;
var mouse_down = (SUPPORTS_TOUCH ? 'ontouchstart' : 'onmousedown');

// UI要素の準備
var soundElements = {};
for (var i = 0, key; key = instruments[i]; i++) {
    soundElements[key] = document.getElementById('sounds-' + key);
}

function LoadBuffers() {
    req.open("GET", 'samples/' + instruments[loadidx] + '.wav', true);
    req.responseType = "arraybuffer";
    req.onload = function() {
        if(req.response) {
            audioContext.decodeAudioData(req.response,function(b){
                buffers[instruments[loadidx]] = b;
                if(++loadidx < instruments.length)
                    LoadBuffers();
            },function(){});
        }
    };
    req.send();
}

function getUserList () {
    //ユーザリストを取得
    $.get('https://skyway.io/active/list/'+APIKEY,
        function(list){
            for(var cnt = 0;cnt < list.length;cnt++){
                if($.inArray(list[cnt],userList)<0 && list[cnt] != peer.id && list[cnt].search('host') == 0){
                    userList.push(list[cnt]);
                    $('#contactlist').append($('<option>', {"value":list[cnt],"text":list[cnt]}));
                }
            }
        }
    );
}

function sendMsg(type, message, instruments, key) {

	var data = {
		type: type,
		user: userName,
		text: message,
        inst: instruments,
        key : key
	};

    for(var i = 0; i < peerConn.length; i++){
    	peerConn[i].send(data);
    }
    // console.log(data);
}

function makeSounds(buffer){
    var source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    source.start(0);
}

function playSound(note) {
    // Play sound if instrument is not muted
    var key = note.key;
    if (muted.indexOf(key) < 0) {
        console.log('TRIGGER: ' + key);
        $('sounds-' + key).trigger('addNote');
        setTimeout(function() {
            makeSounds(buffers[key]);
        }, leadIn)
        //makeSounds(buffers[key]);
    }
}

// 音楽に合わせて音を出すべきか
function checkSound() {
    if (drum.length < 1) {
        endMusic();
    } else if (drum[0].time * multiplier === count) {
        console.log('BEAT');
        currentBeat = drum.shift();
        if ( currentBeat === null) endMusic();
        else currentBeat.data.forEach(playSound);
    }
    count += interval;
}

function endMusic() {
    isSession = false;
    $('#waiting').show();
    $('#starting').hide();
    window.clearInterval(timer);

    for (var i = 0, player; player = playerList[i]; i++) {
        $('#history ul').prepend('<li>' + player + ' score: ' + scores[player] + '</li>');
    }
}

// 難易度を設定する
function setDifficulty() {
    var difficulties = document.querySelectorAll('input[name=difficulty]');
    
    for (var i = 0, difficulty; difficulty = difficulties[i]; i++) {
        if (difficulty.checked) {
            bpm = levels[difficulty.value].bpm; // beats per minute
            margin = levels[difficulty.value].margin; // How many milliseconds to forgive missed beats
        }
    }
    
    bps = bpm / 60; // beats per second
    interval = (1000 / bps / accuracy) >> 0; // seconds per beat
    multiplier = interval * accuracy;
}

function startMusic() {
    setDifficulty();
    
    // スコアのリセット
    for (var i = 0, player; player = playerList[i]; i++) {
       console.log(player);
    }  

    // 音楽用のタイマー
    timer = window.setInterval(checkSound, interval);
    checkSound();
    isSession = true;
    $('#waiting').hide();
    $('#starting').show();
}


function setPlayerList(player){

    // playerがplayerListの配列にあるかどうかを確認する
    if (playerList.indexOf(player) < 0) {
        playerList.push(player); // playerList配列に追加
        $('#session').append(player);
        scores[player] = 0; // スコアのリセット
    }

    if(playerList.length == chatList.length) {
        console.log("all mens ready!");
        heartBeat();
        clearTimeout(countdown);
        $("#waiting").hide();
        $("#starting").show();
        startMusic();
    }
}

function setMutedList(data) {
    if(data.key != undefined) instList[data.user] = data.key;

    for(var i = 0, muted = []; i < playerList.length; i++) {
        if(instList[playerList[i]] != undefined ) {
            muted[muted.length] = instList[playerList[i]];
        }
    }

    console.log('mute inst is ' + muted);
}

function heartBeat(){
    if(lagList) console.log(lagList);
    HBStartTime = new Date();
    for(var i = 0; i < peerConn.length; i++){
        peerConn[i].send({type:'info',text:'heartbeat'});
    }
}

function getTransferLag(data){
    var HBEndTime = new Date();
    var lag = HBEndTime - HBStartTime;

    lagList[data.user] = (undefined) ? 0 : lag/2;

    // console.log('Transfer lag time : ' + data.user + ' ' + lag/2 + 'ms');
}

function doScore(data, isGood) {
    if (isGood) {
        $('#sounds-' + data.key).trigger('check:great');
        $('#history ul').prepend('<li>Great!</li>');
        scores[data.user] += 50;
    } else {
        $('#sounds-' + data.key).trigger('check:miss');
        $('#history ul').prepend('<li>Oops</li>');
        scores[data.user] += 20;
    }
}

function checkAccuracy(data) {
    var soundTime = count - lag; // lagList.peerid; 
    var nextBeat = drum[0];
    
    if (soundTime - currentBeat.time * multiplier < nextBeat.time * multiplier - soundTime) {
        // currentBeat is closest, i.e. user is late
        for (var i = 0, len = currentBeat.data.length; i < len; i++) {
            if (currentBeat.data[i].key === data.key) {
                if (soundTime - currentBeat.time * multiplier < margin) {
                    doScore(data, true);
                } else {
                    doScore(data, false);
                }
            }
        }
    } else {
        // nextBeat is closest, i.e. user is early
        for (var i = 0, len = nextBeat.data.length; i < len; i++) {
            if (nextBeat.data[i].key === data.key) {
                if (nextBeat.time * multiplier - soundTime < margin) {
                    doScore(data, true);
                } else {
                    doScore(data, false);
                }
            }
        }
    }
}

function makePlayerCard(conn) {

    var cardNum = 0;
    for(var i=0; i<chatList.length; i++) {
        if(chatList[i]==conn.peer) cardNum=i;
    }

    var item = '<div class="sss-unitInfo client" id="card-' + cardNum + '"><p class="sss-unitInfo-id" id="id-' + cardNum + '">' + conn.peer + '</p><p class="sss-unitInfo-inst" id="inst-' + cardNum + '">Drums</p><p class="sss-unitInfo-type" id="key-' + cardNum + '"></p><span class="sss-unitInfo-arrow"></span></div>';

    $("#playerCard").append(item);
}

function updatePlayerCard(data) {

    var cardNum;
    for(var i=0; i<chatList.length; i++) {

        console.log(chatList[i] + data.user);

        if(chatList[i]==data.user) cardNum=i;
    }

    var keyName;
    var keyClass;

    switch(data.key){
        case 'hh': 
            keyName = 'Hi-hat';
            keyClass = 'unit-hh';
            break;
        case 'sd': 
            keyName = 'Snare Drum';
            keyClass = 'unit-sd';
            break;
        case 'bd': 
            keyName = 'Bass Drum';
            keyClass = 'unit-bd';
            break;
        case 'cy': 
            keyName = 'Cymbal'; 
            keyClass = 'unit-cy';
            break;
    }

    if(cardNum==0) {
        // $('#key-0').text(data.key);
        $("#key-0").text(keyName);
        $("#card-0").removeClass('unit-hh unit-sd unit-db unit-cy');
        $("#card-0").addClass(keyClass);
    } else if (cardNum==1) {
        $('#key-1').text(keyName);
        $("#card-1").removeClass('unit-hh unit-sd unit-db unit-cy');
        $("#card-1").addClass(keyClass);
    } else if (cardNum==2) {
        $('#key-2').text(keyName);
        $("#card-2").removeClass('unit-hh unit-sd unit-db unit-cy');
        $("#card-2").addClass(keyClass);
    } 
}

function dataChannelEvent(conn){
	peerConn[peerConn.length] = conn;
    $('#their-id').append(conn.peer);
    $("#sound-buttons").show();
    $("#session-call").show();

    chatList[chatList.length] = conn.peer;
    // makePlayerCard(conn);


    // for(var i = 0; i < peerConn.length; i++){
        peerConn[peerConn.length - 1].on('data', function(data){

            if(isSession){
                checkAccuracy(data);
            }
            
            // console.log(data);
            if(data.type === 'sound') {
                makeSounds(buffers[data.key]);
                $('#history ul').prepend('<li> ' + data.user + ' : ' + data.key + ' (' + data.inst + ')</li>');
            }
            else if(data.type == 'info'){
                if(data.text == 'Ready?') $("#session-response").show();
                if(data.text == 'OK!') {
                    setPlayerList(data.user);
                    setMutedList(data);
                }
                if(data.text == 'heartbeat') sendMsg('info','alive');
                if(data.text == 'alive') getTransferLag(data);
                if(data.text == 'inst') {
                    setMutedList(data);
                    updatePlayerCard(data);
                }

            }
        });
    // }

}


// イベントハンドラー
$(function(){
    $("#sound-buttons").hide();
    $("#session-call").hide();
    $("#session-response").hide();

    // PCスマホ間のver違いによるエラー対策
    util.supports.sctp = false;

    // load sounds
    LoadBuffers();
    
    // イベントリスナーの追加
    $('#make-connection').click(function(event) {
        connect($('#contactlist').val());
    });

    $('#session-call').click(function(event) {
       sendMsg('info', 'Ready?');
        $('#session-call').text('募集中...');
        $('#session').append('join : ');  
    });

    $('#session-response').click(function(event) {
        sendMsg('info', 'OK!', myInst, myKey);
        $('#session-response').hide();
        // countdown = setTimeout('startMusic()',1000);
    });
 
    $('#music-start').click(function(event) {
        // // 音楽用のタイマー
        // timer = window.setInterval(checkSound, interval);
        // checkSound();
        startMusic();
        $('#waiting').hide();
        $('#starting').show();
    });
 
     $('#tab-hh').click(function(event) {
        myInst = 'drum';
        myKey = 'hh';
        sendMsg("info","inst",myInst,myKey);
    });
    $('#tab-bd').click(function(event) {
        myInst = 'drum';
        myKey = 'bd';
        sendMsg("info","inst",myInst,myKey);
    });
    $('#tab-sd').click(function(event) {
        myInst = 'drum';
        myKey = 'sd';
        sendMsg("info","inst",myInst,myKey);
    });

    soundElements['hh'][mouse_down] = function(event) {
        sendMsg('sound', 'hh', 'drum', 'hh');
        $('#history ul').prepend('<li> you : Hi-hat</li>');
    };
    soundElements['sd'][mouse_down] = function(event) {
        sendMsg('sound', 'sd', 'drum', 'sd');
        $('#history ul').prepend('<li> you : Snare Drum</li>');
    };
    soundElements['bd'][mouse_down] = function(event) {
        sendMsg('sound', 'bd', 'drum', 'bd');
        $('#history ul').prepend('<li> you : Bass Drum</li>');
    };
    // soundElements['cy'][mouse_down] = function(event) {
    //     sendMsg('sound', 'cy', 'drum', 'cy');
    //     $('#history ul').prepend('<li> you : Cymbal</li>');
    // };
    
    //ユーザリスト取得開始
    setInterval(getUserList, 2000);
    setInterval(heartBeat, 20000);
});