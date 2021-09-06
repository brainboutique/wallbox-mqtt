import fs from "fs";
import {ClientConfig} from "./types";
import { wallboxAPI } from "./wallboxAPI";
import {MqttClient} from "mqtt";
var mqtt = require('mqtt')
var mqttClient: MqttClient;


require("dotenv").config();



export const config: ClientConfig = loadConfig("./config/config.json");
let chargersList:any=null;
let lastExposedData:any={};

mqttInit(config);

//sql.migrate();

function loadConfig(configPath: string) {
  const data = fs.readFileSync(configPath);
  return JSON.parse(data.toString());
}

export function mqttInit(clientConfig:ClientConfig) {
    mqttClient = mqtt.connect("mqtt://"+config.mqtt.host+":"+config.mqtt.port, { username: config.mqtt.username, password: config.mqtt.password, will: { topic: config.mqtt.rootTopic +"proxyStatus", payload: 'offline', retain:true } });

    mqttClient.on("connect",()=>{
        mqttClient.publish(config.mqtt.rootTopic +"proxyStatus","online", {retain:true});
        mqttClient.subscribe(config.mqtt.rootTopic+"#");
    })

    mqttClient.on('message',(topic, message:string, packet)=>{
        //console.log("In '"+topic+"' :"+ message);
        var t = topic.split('/');
	var m = (message+'').split(' ');
        if (t[2]=='command') {
            if (message == 'unlock')
                api.unlock(t[1]);
            if (message == 'lock')
                api.lock(t[1]);
            if (message == 'start')
                api.start(t[1]);
            if (message == 'pause')
                api.pause(t[1]);
            if (m[0] == 'maxCurrent')
                api.maxCurrent(t[1], m[1]);
        }
    });
}


var api:wallboxAPI=new wallboxAPI(config.wallbox);

setInterval(async ()=>{
    if (!chargersList) {
        chargersList = await api.getChargersList();
        //console.log("myid ", chargersList[0].chargers);
    }

    let id=chargersList[0].chargers[0].id;
    var f = await api.getChargerDetails(id);
    if (f && f.status) {
        var exposedData:any = {
            locked: f.locked,
            autolock: !!f.auto_lock,
            maxCurrent: f.maxChargingCurrent,
            statusCode: f.status,
            status: f.statusDescription
        }
        //console.log("Full: ", f);
        //console.log("Detail: ", exposedData);
        if (lastExposedData.status != exposedData.status) mqttClient.publish(config.mqtt.rootTopic + id + "/status", String(exposedData.status), {retain:true});
        if (lastExposedData.locked != exposedData.locked) mqttClient.publish(config.mqtt.rootTopic + id + "/locked", ""+String(!!exposedData.locked), {retain:true});
        if (lastExposedData.maxCurrent != exposedData.maxCurrent) mqttClient.publish(config.mqtt.rootTopic + id + "/maxCurrent", String(exposedData.maxCurrent), {retain:true});
        lastExposedData=exposedData;
    } else {
        var exposedData:any = {
            status: "Error getting status"
        }
        if (lastExposedData.status != exposedData.status)
            mqttClient.publish(config.mqtt.rootTopic + id + "/status", exposedData.status, {retain:true});
        lastExposedData=exposedData;
    }

},config.wallbox.pollInterval*1000 || 30000);
