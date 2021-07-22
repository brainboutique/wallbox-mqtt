import {ClientConfigHostWallbox} from "./types";

const https = require('https');

export class wallboxAPI {

    apiHost = "api.wall-box.com";

    jwt:string;

    timestampLastAuth:number;

    deltaReauthentication:number;

    config:ClientConfigHostWallbox;

     constructor(config: ClientConfigHostWallbox) {
        this.config=config;
        //console.log("Initializiing wallbox ", config);
        this.jwt="";
	this.timestampLastAuth=0;
	this.deltaReauthentication=1000*60*60*24; // reauthenticate every 24 hours
    }

    getRaw(path:string, payload:any, options:any) {
        var body = ''

        //console.log("Config",this.config);
        //console.log("Req ",options.method, payload);
        return new Promise((resolve, reject)=>{
            var req=https.request({
                hostname:this.apiHost,
                path:path,
                headers:{...{
                    "Accept": "application/json",
                    "Content-Type": "application/json;charset=UTF-8"},
                    ...options.headers},
                method:options.method // || "GET"
            }, (res:any) => {
                res.setEncoding('utf8');
                res.on("data", (data:any) => {
                    body += data;
                });
                res.on("end", () => {
                    try {
                        var bodyJson = JSON.parse(body);
                        resolve(bodyJson);
                    }catch(e) {
                        console.error("Invalid JSON: body");
                        reject(500);
                    }
                });
                res.on("error", (e:any) => {
                    console.error("Error ",e);
                    reject(res.statusCode);
                });
            });

            if (payload) 
	    {
		req.write(JSON.stringify(payload));
		//console.log("Payload-JSON-stringified: " + JSON.stringify(payload));
	    }
            req.end();
        });

    }



    async authenticate() {
        var r:any = await this.getRaw("/auth/token/user",null, {headers:{authorization: "Basic " + Buffer.from(this.config.username + ":" + this.config.password).toString("base64")}});
        if (r.status==200 && r.jwt) {
            this.jwt=r.jwt;
            //console.log("Auth succes");
            return true;
        }
        else {
            console.error("Authentication failed", r,r.status,!!r.jwt);
            return false;
        }
    }

    async get(path:string, payload:any, options:any) {

	if (this.timestampLastAuth + this.deltaReauthentication < Date.now()) {
	    this.jwt="";
	}
        if (this.jwt) {
            var r:any=await this.getRaw(path,payload,{...{headers:{authorization:"Bearer "+this.jwt}, ...options}});
            //console.log("Firt try",r);
            return r;
        }
        else {
            var authSuccess:boolean=await this.authenticate();
	    this.timestampLastAuth = Date.now();
            //console.log("Auth success",authSuccess);
            var r:any=await this.getRaw(path,payload,{...{headers:{authorization:"Bearer "+this.jwt},...options}});
            //console.log("Second try",r);
            return r;
        }
    }


    async getChargersList() {
         var r=await this.get("/v3/chargers/groups",null,{});
         if (r && r.result && r.result.groups)
             return(r.result.groups);
         else
         {
             console.error("Error parsing response, ",r);
             return null;
         }
    }

    async getChargerDetails(id:string) {
        var r=await this.get("/v2/charger/"+id,null,{});
        if (r && r.data && r.data.chargerData)
            return(r.data.chargerData);
        return null;
    }

    async lock(id:string) {
        var r=await this.get("/v2/charger/"+id,{locked:1},{method:"PUT"});
        //console.log("Lock: ",r);
        return(r);
    }
    async unlock(id:string) {
        var r=await this.get("/v2/charger/"+id,{locked:0},{method:"PUT"});
        //console.log("Unlock: ",r);
        return(r);
    }

    async pause(id:string) {
        var r=await this.get("/v3/chargers/"+id+"/remote-action",{action:2},{method:"POST"});
        //console.log("Pause: ",r);
        return(r);
    }
    async start(id:string) {
        var r=await this.get("/v3/chargers/"+id+"/remote-action",{action:1},{method:"POST"});
        //console.log("Start: ",r);
        return(r);
    }

    async maxCurrent(id:string, current:any) {
        var r=await this.get("/v3/chargers/"+id,{maxChargingCurrent:current},{method:"PUT"});
        //console.log("Start: ",r);
        return(r);
    }

}

