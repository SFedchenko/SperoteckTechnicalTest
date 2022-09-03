const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer(
    (req, res) => {
        if (req.method === 'GET') {
            res.writeHead(200, {
                'Content-Type': 'text/html; charset=utf-8'
            });

            if (req.url === '/') {
                fs.readFile(
                    path.join(__dirname, 'views', 'form.html'),
                    'utf-8',
                    (err, content) => {
                        if (err) throw err;
                        res.end(content);
                    }
                );
            }
        } else if (req.method === 'POST') {
            if (req.url === '/response') {
                const inputsBuffer = [];
                res.writeHead(200, {
                    'Content-Type': 'text/html; charset=utf-8'
                });

                req.on('data', data => {
                    inputsBuffer.push(Buffer.from(data));
                });

                req.on('end', () => {
                    const inputsArray = inputsBuffer.toString().split('&').map(
                        el => el.split('=')
                    );
                    const inputsObject = {};
                    for (const el of inputsArray) {
                        inputsObject[el[0]] = el[1];
                    };
                    if (inputsObject.age >= 18) {
                        res.end(`
                            <h2>Hello, ${inputsObject.firstName} ${inputsObject.lastName}!</h2>
                            <a href="/">Return to form</a>
                        `);
                    } else {
                        res.end(`
                        <h2>Hello, ${inputsObject.firstName}! Unfortunately, you will have to wait a bit.</h2>
                        <a href="/">Return to form</a>
                    `);
                    }
                });
            };
        }
    }
);

server.listen(3000, () => {});