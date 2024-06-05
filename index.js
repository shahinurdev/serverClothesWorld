const express = require("express");
const app = express();
const port = process.env.PORT
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');

app.use(cors());
app.use(express.json());

function createToken (user) {
const token = jwt.sign({
  email: user.email
},
'secret', 
{ expiresIn: '7d' });
return token;
};
function verifyToken (req, res, next) {
  const authToken = req.headers.authorization.split(' ')[1];
  const verifyToken = jwt.verify(authToken,"secret");
  if(!verifyToken?.email){
    return res.send("You are not authorized ")
  }
  req.user = verifyToken.email;
  next()
}




const uri = process.env.DATABASE_URL;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    await client.connect();
    const clothesDB = client.db("clothesDB");
    const usersDB = client.db("usersDB");
    const clotheCollection = clothesDB.collection("clothe_collection");
    const usersCollection = usersDB.collection("usersCollection");

    // cloth routes
    app.post("/clothes", async (req, res) => {
      const clotheData = req.body;
      const result = await clotheCollection.insertOne(clotheData);
      res.send(result);
    });

    app.get("/clothes", async (req, res) => {
      const clotheData = clotheCollection.find();
      const result = await clotheData.toArray();
      res.send(result);
    });

    app.get("/clothes/:id", async (req, res) => {
      const id = req.params.id;
      const clotheData = await clotheCollection.findOne({ _id: new ObjectId(id) });
      res.send(clotheData);
    });

    app.patch("/clothes/:id", async (req, res) => {
      const id = req.params.id;
      const updateData = req.body;
      const result = await clotheCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData }
      );
      res.send(result);
      console.log(result);
    });

    app.delete("/clothes/:id", async (req, res) => {
      const id = req.params.id;
      const result = await clotheCollection.deleteOne(
        { _id: new ObjectId(id) }
      );
      res.send(result);
      console.log(result);
    });

    // user routes
    app.post("/user",verifyToken , async (req, res) => {
      const user = req.body;
      const token = createToken(user);
      const isUserExist = await usersCollection.findOne({ email: user?.email });
      if (isUserExist?._id) {
        return res.send({
          status: "welcome login ",
          message: "Login successfully",
          token
        });
      }
    await usersCollection.insertOne(user);
      res.send({token});
    });

    app.get("/user/get/:id", async (req, res) => {
      const id = req.params.id;
      const result = await usersCollection.findOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    app.get("/user/:email", async (req, res) => {
      const email = req.params.email;
      const result = await usersCollection.findOne({ email });
      res.send(result);
    });

    app.patch("/user/:email", async (req, res) => {
      const email = req.params.email;
      const userData = req.body;
      const result = await usersCollection.updateOne(
        { email },
        { $set: userData },
        {upsert: true },
      );
      res.send(result);
    });

    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally { 
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.status(200).send("welcome to server");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
