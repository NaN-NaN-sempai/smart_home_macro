const express = require("express");
const path = require("path");
const app = express();
app.use(express.json()); 


const assistantCommand = require("./lib/googleAssistant");


app.get('/', (req, res) => {
	res.sendFile(path.join(__dirname, 'src/pages/index.html'));
});
app.post('/assistantCommand', async (req, res) => {
	const {command} = req.body; 

	let response = await assistantCommand(command);

	res.send(response);
});
  
app.listen(3000, () => {
	console.log('Servidor Express está rodando na porta 3000');
});








/* (async () => {
	try {
		let txt = await assistantCommand("ola");
	
		console.log(txt);
		txt = await assistantCommand("boa noite");
	
		console.log(txt);
	} catch {

	}
})() */