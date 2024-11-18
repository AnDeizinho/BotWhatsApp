const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js')
const qrcode = require('qrcode');
const { createCanvas } = require('canvas');
const cors = require('cors');
const path = require('path');
const web = express();
const db = require('./database');


web.use(cors());
web.use(express.json());

let qrCodeImage = null
let messageResponse = "teste de resposta automática"


const client = new Client({
    authStrategy: new LocalAuth()
});


client.on('qr', async (qr) => {
    const canvas = createCanvas(300, 300);
    await qrcode.toCanvas(canvas, qr)
    qrCodeImage = canvas.toBuffer()
    console.log('QR Code recebido, escaneie o código com o WhatsApp.');
});


client.on('ready', () => {
    console.log('Cliente está pronto!');
});


client.on('message', async message => {
    if (!message.isGroupMsg) {
        const phoneNumber = message.from.replace("@c.us", "");
        db.numberExists(phoneNumber, async (err, exists) => {
            if (err) {
                console.log(`[post] [on/message] ${phoneNumber}:`, err.message);
                return;
            }

            const contact = await message.getContact();
            const name = contact.pushname || contact.name;

            if (!exists) {
                const msg = messageResponse.replace("{contact.name}", name);
                client.sendMessage(message.from, msg);
                db.createContact(phoneNumber, name, (err, result) => {
                    if (err) {
                        console.log(`[post] [on/message] ${phoneNumber}:`, err.message);
                    } else {
                        console.log(`[post] [on/message] Contato criado: ${phoneNumber}, ${name}`);
                    }
                });
            } else {
                db.isAlreadyAnswered(phoneNumber, (err, answered) => {
                    if (err) {
                        console.log(`[post] [on/message] ${phoneNumber}:`, err.message);
                        return;
                    }

                    if (!answered) {
                        const msg = messageResponse.replace("{contact.name}", name);
                        client.sendMessage(message.from, msg);
                        db.updateContact(phoneNumber, name, 1, (err, result) => {
                            if (err) {
                                console.log(`[post] [on/message] ${phoneNumber}:`, err.message);
                            } else {
                                console.log(`[post] [on/message] Contato atualizado: ${phoneNumber}, ${name}`);
                            }
                        });
                    } else {
                        console.log(`[post] [on/message] O contato ${phoneNumber} já foi respondido.`);
                    }
                });
            }
        });

        console.log(`Mensagem recebida de ${message.author}/${message.from}: ${message.body}`);
    }
});


client.initialize();


web.get('/api/qr-code', (req, res) => {
    if (qrCodeImage) {
        console.log("entrou no if")
        res.setHeader('Content-Type', 'image/png');
        res.send(qrCodeImage);
    }
    else {
        console.log("entrou no else")
        res.status(503).send({ message: "qr code não esta disponível" })
    }
})

web.post("/api/send_message", async (req, res) => {
    const { numbers, message } = req.body;
    const errors = [];
    var success = 0;

    await Promise.all(numbers.map((phoneNumber) => {
        return client.sendMessage(`${phoneNumber}@c.us`, message)
            .then(response => {
                db.numberExists(phoneNumber, async (err, exists) => {
                    const contact = await response.getContact();
                    const name = contact.pushname || contact.name
                    if (err) {
                        console.log(`[post] [api/send_message] ${phoneNumber}`, err.message);
                    }
                    if (!exists) {
                        db.createContact(phoneNumber, name, (err, result) => {
                            if (err) {
                                console.log(`[post] [api/send_message] ${phoneNumber}`, err.message);
                            }
                        });
                    } else {
                        db.updateContact(phoneNumber, name, 0, (err, result) => {
                            if (err) {
                                console.log(`[post] [api/send_message] ${phoneNumber}`, err.message);
                            }
                        });
                    }
                });
                success++;
                console.log('Mensagem enviada:', phoneNumber, success);
            })
            .catch(err => {
                errors.push({ errorNumber: phoneNumber.toString(), message: `Erro ao enviar a mensagem: ${err}` });
                console.error('Erro ao enviar a mensagem:', err);
            });
    }));

    console.log({ sended: success, totalErrors: errors.length, allErrors: errors })
    res.send({ sended: success, totalErrors: errors.length, allErrors: errors })
})

web.post("/api/auto-response", async (req, res) => {
    const { autoResponse } = req.body;
    messageResponse = autoResponse;
    res.send({ message: "Mensagem automática salva !" })
    console.log("[post] [/api/auto-response] nova mensagem automatica salva")
})

web.get("/api/auto-response", async (req, res) => {
    res.send({ message: messageResponse })
    console.log("[get] [/api/auto-response] obtendo mensagem automatica salva")
})

web.use(express.static(path.join(__dirname, 'publish/wwwroot')));

web.listen(3090, () => {
    console.log("Servidor ouvindo na porta 3090");
});
