# Summary

NodeJS proxy to interact with Wallbox Pulsar, Pulsar plus - and maybe other wallboxes as well from https://wallbox.com/.

Supported interactions:
- Configurable root topic, here: "wallbox/"
- On a regular basis (polling required, API does not support subscribe) poll charger(s) and status from upstream API. 
Expose charger info via
```
wallbox/<chargerId>/status
wallbox/<chargerId>/locked
wallbox/<chargerId>/maxCurrent
``` 
- Status is derived from display name of Web API, typical messages are:

  * Paused by user
  * Charging
  * Done
  * Connected: waiting for car demand
  * Locked
  * Ready
  * waiting_to_unlock (Sorry for the spelling - but this comes from upstream!)
  * Error getting status (in case the mqtt proxy cannot connect to API)

- Actions supported
```
wallbox/<chargerId>/command lock
wallbox/<chargerId>/command unlock
wallbox/<chargerId>/command start
wallbox/<chargerId>/command pause
wallbox/<chargerId>/command maxCurrent <current>
```
Note: It seems as if it can take up to a minute (!) for the charger to change status, i.e. pause/start charging!

# Configuration
Update `config/config.json` (see template file) to add Wallbox account info as well as MQTT broker information.
(MQTT Authentication not yet supported.)


```
{
  "wallbox":{
    "username": "my@email.com",
    "password": "MyPassword",
    "pollInterval": "30"
  },
  "mqtt":{
    "host": "192.168.2.25",
    "port": 1883,
    "username": "mqtt@email.com",
    "password": "MqttPassword",
    "rootTopic": "wallbox/",
  }
}

```

- `pollInterval` in seconds. 
- `rootTopic` Topic prefix. For example, "wallbox" would emit "wallbox/2133132/status".

# Getting Started
```
npm install
npm start
```

Next time it can be started directly using
```
node dist/client.js
```

# Systemd autostart

` /etc/systemd/system/wallboxMqtt.service`
```
[Unit]
Description=Wallbox MQTT Brigde
Wants=network.target
After=network.target

[Service]
Type=simple
User=pi
Group=dialout
WorkingDirectory=/home/pi/wallbox-mqtt
ExecStart=/usr/local/bin/node dist/client.js
StandardOutput=null
Restart=always

[Install]
WantedBy=multi-user.target

```

`systemctl daemon-reload`

Manual start / stop via

`service wallboxMqtt start`

Enable auto start on system boot:

`systemctl enable wallboxMqtt`
