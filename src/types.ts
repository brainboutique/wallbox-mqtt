export interface ClientConfig {
    wallbox: ClientConfigHostWallbox;
    mqtt: ClientConfigMQTT;
}
export interface ClientConfigHostWallbox {
    username: string;
    password: string;
    pollInterval: number
}
export interface ClientConfigMQTT {
    plainPayload: boolean;
    rootTopic: string;
    host: string;
    port: number;
}
