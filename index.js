const http = require('http');
const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

const uri = 'mongodb+srv://sfedchenko:<password>@cluster0.qnq9gfj.mongodb.net/?retryWrites=true&w=majority';

const client = new MongoClient(uri);

async function insertRecord(customerData, res) {
    try {
        const database = client.db("eCommerce");
        const customers = database.collection("customers");
        const result = await customers.insertOne(customerData);
        res.end(`
            <h2>Customer record was saved successfully. Id - ${result.insertedId}.</h2>
            <a href="/">Return to form</a><br><br>
            <a href="/search">Return to search</a>
        `);
    } finally {
        await client.close();
    }
};

async function getFullNamesByEmail(requestedEmail, res) {
    try {
        const database = client.db("eCommerce");
        const customers = database.collection("customers");
        const query = { email: requestedEmail };
        const options = {
            projection: { _id: 0, firstName: 1, lastName: 1 },
        };
        const cursor = customers.find(query, options);
        const records = (await cursor.toArray()).map(element =>
            element.firstName + ' ' + element.lastName);
        if (records.length === 0) {
            res.end(`
                <h2>There are no records for this email.</h2>
                <a href="/">Return to form</a><br><br>
                <a href="/search">Return to search</a>
            `);
        } else {
            const recordsToDisplay = records.map(element =>
                '<p>' + element + '</p>').join('');
            console.log(recordsToDisplay);
            res.end(`
                <h2>Appropriate data for requested email:</h2>
                ${recordsToDisplay}
                <a href="/">Return to form</a><br><br>
                <a href="/search">Return to search</a>
            `);
        };
    } finally {
        await client.close();
    }
  };
  

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
            } else if (req.url === '/search') {
                fs.readFile(
                    path.join(__dirname, 'views', 'search.html'),
                    'utf-8',
                    (err, content) => {
                        if (err) throw err;
                        res.end(content);
                    }
                );
            };
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
                        delete inputsObject.age;
                        insertRecord(inputsObject, res).catch(error => {
                            res.end(`
                                <h2>Oops, something went wrong. Please, try again.</h2>
                                <a href="/">Return to form</a><br><br>
                                <a href="/search">Return to search</a>
                            `);
                            console.log(error);
                        });
                    } else {
                        res.end(`
                        <h2>Hello, ${inputsObject.firstName}! Unfortunately, you will have to wait a bit.</h2>
                        <a href="/">Return to form</a>
                    `);
                    }
                });
            } else if (req.url === '/searchByEmail') {
                const inputsBuffer = [];
                res.writeHead(200, {
                    'Content-Type': 'text/html; charset=utf-8'
                });

                req.on('data', data => {
                    inputsBuffer.push(Buffer.from(data));
                });

                req.on('end', () => {
                    const requestedEmail = inputsBuffer.toString().split('=')[1];
                    getFullNamesByEmail(requestedEmail, res).catch(error => {
                        res.end(`
                            <h2>Oops, something went wrong. Please, try again.</h2>
                            <a href="/">Return to form</a><br><br>
                            <a href="/search">Return to search</a>
                        `);
                        console.log(error);
                    });
                });
            };
        }
    }
);

server.listen(3000, () => {});