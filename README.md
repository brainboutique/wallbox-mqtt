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
  * offline (in case the mqtt proxy is offline or cannot connect to API)

- Actions supported
```
wallbox/<chargerId>/lock
wallbox/<chargerId>/unlock
wallbox/<chargerId>/start
wallbox/<chargerId>/pause
```


# Configuration
Update config/config.json (see template file) to add Wallbox account info as well as MQTT broker information.
(MQTT Authentication not yet supported.)


```
{
  "wallbox":{
    "username": "my@email.com",
    "password": "MyPassword"
  },
  "mqtt":{
    "host": "192.168.2.25",
    "port": 1883,
    "rootTopic": "wallbox/",
  }
}

```


- rootTopic: Topic prefix. For example, "wallbox" would emit "wallbox/2133132/status".

# Getting Started
```
npm install
npm start
```

# Features
