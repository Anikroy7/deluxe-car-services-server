const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express');
const cors = require('cors');
var jwt = require('jsonwebtoken');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;

// middeleware

app.use(cors())
app.use(express.json())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.n8ou5.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {

        await client.connect()
        const serviceCollection = client.db('deluxeCar').collection('service')
        const orderCollection = client.db('deluxeCar').collection('order');

        app.get('/service', async (req, res) => {
            const query = {};
            const cursor = serviceCollection.find(query)
            const services = await cursor.toArray();
            res.send(services)
        })
        // POST METHOD

        app.post('/service', async (req, res) => {
            const doc = req.body;
            const result = await serviceCollection.insertOne(doc)
            res.send(result)
        })
        app.post('/login', async (req, res) => {
            const user = req.body;
            const accsessToken = jwt.sign(user, process.env.ACCSESS_TOKEN_SECRET, { expiresIn: '1d' })
            res.send({ accsessToken });
        })

        //  jwt verify function

        function verifyJwt(req, res, next) {
            const authHeader = req.headers.authorization;
            if (!authHeader) {
                return res.status(401).send('forbidden accsess')
            }

            const token = authHeader.split(' ')[1]

            jwt.verify(token, process.env.ACCSESS_TOKEN_SECRET, (err, decoded) => {

                if (err) {
                    res.status(401).send({ message: 'unauthorized accsess' })
                }
                req.decoded = decoded;
                next();
            })

        }


        // DELETE

        app.delete('/service/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: ObjectId(id) }
            const result = await serviceCollection.deleteOne(query)
            res.send(result)
        })
        app.get('/order', verifyJwt, async (req, res) => {
            const decodedEmail = req?.decoded?.email;
            const email = req.query.email;
            if (decodedEmail === email) {
                const query = { email };
                const cursor = orderCollection.find(query);
                const result = await cursor.toArray()
                res.send(result)
            }
            else {
                res.status(403).send({ message: 'forbidden accsess' })
            }
        })

        app.post('/order', async (req, res) => {
            const order = req.body;
            const result = await orderCollection.insertOne(order);
            res.send(result)
        })

        app.get('/service/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const service = await serviceCollection.findOne(query)
            res.send(service)
        })

    }
    finally {

    }
}
run().catch(console.dir)

app.get('/', (req, res) => {
    res.send('my deluxe car service center is running')
})

app.listen(port, () => {
    console.log('deluxe server is running');
})