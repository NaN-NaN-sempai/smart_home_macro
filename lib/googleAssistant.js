const fs = require('fs');
const path = require('path');
const express = require("express");
const app = express();
const port = 3015;
const serverUrl = "http://localhost:" + port;
 

const GoogleAssistant = require('google-assistant'); 
let keyFilePath = path.resolve(__dirname, '../oauth/oauth.json');
let googleStuff = path.resolve(__dirname, 'googleAssistant'); 
if (!fs.existsSync(googleStuff)) fs.mkdirSync(googleStuff);
let savedTokensPath = path.resolve(googleStuff, 'tokens.json');


if (fs.existsSync(keyFilePath)) {
    let jsonData = fs.readFileSync(keyFilePath, 'utf8');
    let json = JSON.parse(jsonData);

    let redirect_uris = json["web"]["redirect_uris"];

    if(!redirect_uris || JSON.stringify(redirect_uris) != JSON.stringify(["https://localhost:" + port])) {
        json["web"]["redirect_uris"] = [serverUrl];
        const overWrite = JSON.stringify(json, null, 2);
        fs.writeFileSync(keyFilePath, overWrite, 'utf8');
    }
} else throw "No OAuth file."

let expressServer;
if(!fs.existsSync(savedTokensPath)) {
    app.get('/', (req, res) => {
        res.sendFile(path.join(googleStuff, 'index.html'));
    });
      
    expressServer = app.listen(port, () => {
        console.log(`Express Server in: ${serverUrl}`);
    });
}

const config = {
	auth: {
		keyFilePath,
		savedTokensPath,
	},
	conversation: {
		lang: 'pt-BR', 
		showDebugInfo: false, 
	},
};


const assistant = new GoogleAssistant(config.auth);
let assistantReady = false;	 
assistant
	.on('ready', () => { 
		assistantReady = true;
        if(expressServer) { 
            expressServer.close(() => {
                console.log('Express Server Closed...');
            });
        }
	})
	.on('error', (error) => {
		console.log('Assistant Error:', error);
	});

module.exports = assistantCommand = (command) => new Promise((resolve, reject) => {
    if(assistantReady == "error") reject("Assistant is closed");
    const runCommand = () => {
        const startConversation = (conversation) => {
            // setup the conversation
            conversation
                .on('response', text => {
                    resolve(text); 
                })
                .on('debug-info', info => {
                    resolve('Debug Info:' + info);  
                })
                // if we've requested a volume level change, get the percentage of the new level
                .on('volume-percent', percent => {
                    resolve('New Volume Percent:' + percent);   
                })
                // the device needs to complete an action
                .on('device-action', action => {
                    resolve('Device Action:', action);    
                })
                // once the conversation is ended, see if we need to follow up
                .on('ended', (error, continueConversation) => {
                    if (error) {
                        reject('Conversation Ended Error: ' + error);
                    }/*  else { 
                        conversation.end();
                    } */
                })
                // catch any errors
                .on('error', (error) => {
                    reject('Conversation Ended Error: ' + error); 
                });
        };
        
        config.conversation.textQuery = command;
        assistant.start(config.conversation, startConversation);
    }

    const checkFlag = () => {
        if(assistantReady) runCommand();
        else setTimeout(checkFlag, 100);
    }

    checkFlag();
});
