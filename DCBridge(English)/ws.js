var WS = new WSClient();

var tar = 'ws://127.0.0.1:6000'

//設定
var Playerchat = true;
var PlayerJoin = true
var PlayerLeft = true;
var PlayerDie = false;
var Logs = true;

function connectionStauts() {
    switch (WS.status) {
        case 0:
            {
                logger.info('WebSocket connection successful!');
                let type = 'serverstart'
                let time = system.getTimeStr();

                WS.send(JSON.stringify({
                    type,
                    time
                }));
                break;
            }
        case 1:
            {
                logger.info('Server connect close');
                break;
            }
        case 2:
            {
                logger.info('Server connect close');
                logger.info('trying to reconnect server...');
                setTimeout(() => {
                    if (WS.status != 0) {
                        logger.info('stauts:', WS.connect(tar), WS.status);
                        connectionStauts();
                    } else {
                        logger.info('connect server success');
                    }
                }, 10 * 1000);
                break;
            }
        default:
            {
                logger.info('Unknown server connect status');
            }
    }
}

function toJSON(str) {
    if (typeof str == 'string') {
        try {
            var obj = JSON.parse(str);
            if (typeof obj == 'object' && obj) { return obj; } else { return false; }
        } catch (e) {}
    }
}

function datetime_to_unix(datetime) {
    var tmp_datetime = datetime.replace(/:/g, '-');
    tmp_datetime = tmp_datetime.replace(/ /g, '-');
    var arr = tmp_datetime.split("-");
    var now = new Date(Date.UTC(arr[0], arr[1] - 1, arr[2], arr[3] - 8, arr[4], arr[5]));
    return parseInt(now.getTime() / 1000);
}


mc.listen('onServerStarted', function() {
    logger.info('trying reconnect server');
    if (WS.status != 0) {
        logger.info('stauts:', WS.connect(tar), WS.status);
        connectionStauts();
    } else {
        logger.info('success connect server');
    }
});
WS.listen('onError', (err) => {
    logger.info('server connect error');
    logger.error('Error code: ' + err);
})
WS.listen('onLostConnection', (msg) => {
    logger.info('lose server connect');
    logger.error('Error code: ' + msg);
});
setInterval(() => {
    if ((WS.status == 2)) {
        logger.info('stauts:', WS.connect(tar), WS.status);
        connectionStauts();
    }
}, 1000 * 10);

if (Playerchat == true) {
    mc.listen('onChat', function(pl, msg) {
        let playername = pl.realName
        WS.send(JSON.stringify({
            type: 'chat',
            message: msg,
            time: system.getTimeStr(),
            player: playername
        }));
    });
}

if (PlayerJoin == true) {
    mc.listen('onJoin', (pl, msg) => {
        let dv = pl.getDevice();
        WS.send(JSON.stringify({
            type: 'PlayerJoin',
            JoinPlayer: pl.realName,
            time: system.getTimeStr(),
        }))
    })
}

if (PlayerLeft == true) {
    mc.listen('onLeft', (pl, msg) => {
        WS.send(JSON.stringify({
            type: 'PlayerLeft',
            LeftPlayer: pl.realName,
            time: system.getTimeStr()
        }))
    })
}

if (PlayerDie == true) {
    mc.listen('onPlayerDie', function(pl, source) {
        if (source == null) {
            let type = 'PlayerSuicide'
            player = pl.realName;

            var Text = ['Died inexplicably', 'disappeared out of thin air', 'Killed by the air', 'Sanctioned by heaven!' , 'Dont want to live!' , 'Died using mysterious power', 'Walked away for no reason...', 'Gone peacefully'];
            var rand = Math.random();
            var randomtext = Text[Math.floor(Math.random() * Text.length)]

            WS.send(JSON.stringify({
                type,
                player,
                randomtext,
                time: system.getTimeStr()
            }))
        } else if (source.type == 'minecraft:player') {
            let type = 'PlayerDie';
            let DiePlayer = pl.realName;
            let kill = source.toPlayer();
            let KillBy = kill.realName;

            WS.send(JSON.stringify({
                type,
                DiePlayer,
                KillBy,
                time: system.getTimeStr()
            }))
        }
    });
}

WS.listen('onTextReceived', function(msg) {
    var Message = toJSON(msg);
    switch (Message.type) {
        case 'message':
            mc.runcmdEx(`tellraw @a {"rawtext":[{"text":"§d[§bDiscord§d] §e${Message.sender}: ${Message.gomsg}"}]}`);
            break;
        case 'Playerlist':
            var result = mc.runcmdEx("list");
            let txt = result.output.replace('There are', 'There are')
            txt = txt.replace('players online:', 'player online:')

            WS.send(JSON.stringify({
                type: 'Playerlist',
                list: txt,
            }))
            break;
        case 'tps':
            var servertps = mc.runcmdEx('tps');
            let servertpss = servertps.output.replace('TPS:', 'Server TPS:')

            WS.send(JSON.stringify({
                type: 'tps',
                tps: servertpss,
            }))
            break;
    }
});
