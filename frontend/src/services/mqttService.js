import mqtt from 'mqtt';

let client = null;

/**
 * MqttService handles the connection and communication with the MQTT broker.
 */
export const MqttService = {
    connect: (config, onConnect, onMessage, onError) => {
        if (client) {
            client.end();
        }

        const { host, port, path, clientId, username, password, subTopic, statusTopic } = config;
        
        // Construct WebSocket URL
        // e.g. wss://broker.hivemq.com:8884/mqtt
        let protocol = 'wss';
        let url = `${protocol}://${host}:${port}${path || '/mqtt'}`;
        
        // Ensure url has protocol if user provided full URL in host field
        if (host.includes('://')) {
             url = host;
        }

        const options = {
            clientId: clientId || `greenhouse_web_${Math.random().toString(16).slice(2, 10)}`,
            clean: true,
            connectTimeout: 5000,
            reconnectPeriod: 5000, // Reconnect every 5 seconds if disconnected
        };

        if (username) options.username = username;
        if (password) options.password = password;

        console.log(`[MQTT] Connecting to ${url}...`);
        
        client = mqtt.connect(url, options);

        client.on('connect', () => {
            console.log('[MQTT] Connected to Broker!');
            const topicsToSub = [];
            if (subTopic) topicsToSub.push(subTopic);
            if (statusTopic) topicsToSub.push(statusTopic);
            // Subscribe ke topik LCD live status dari ESP32
            topicsToSub.push('greenhouse-cibatu/status/lcd');
            // [BUG FIX 2+4] Subscribe ke status solenoid untuk sinkronisasi realtime
            topicsToSub.push('greenhouse-cibatu/status/solenoids');

            if (topicsToSub.length > 0) {
                client.subscribe(topicsToSub, (err) => {
                    if (err) console.error('[MQTT] Subscription error:', err);
                    else console.log(`[MQTT] Subscribed to ${topicsToSub.join(', ')}`);
                });
            }
            if (onConnect) onConnect();
        });

        client.on('message', (topic, message) => {
            const payload = message.toString();
            console.log(`[MQTT] Received message on ${topic}:`, payload);
            if (onMessage) onMessage(topic, payload);
        });

        client.on('error', (err) => {
            console.error('[MQTT] Error:', err);
            if (onError) onError(err);
        });

        client.on('offline', () => {
            console.warn('[MQTT] Client went offline');
            if (onError) onError(new Error('Broker terputus'));
        });
        
        client.on('reconnect', () => {
             console.log('[MQTT] Attempting to reconnect...');
        });

        return client;
    },

    disconnect: () => {
        if (client) {
            client.end();
            client = null;
            console.log('[MQTT] Disconnected from Broker');
        }
    },

    publish: (topic, message) => {
        if (client && client.connected) {
            const payload = typeof message === 'object' ? JSON.stringify(message) : message;
            client.publish(topic, payload, { qos: 0 }, (err) => {
                if (err) {
                    console.error('[MQTT] Publish error:', err);
                } else {
                    console.log(`[MQTT] Published to ${topic}:`, payload);
                }
            });
            return true;
        } else {
            console.warn('[MQTT] Cannot publish, client is not connected.');
            return false;
        }
    },

    isConnected: () => {
        return client ? client.connected : false;
    }
};
