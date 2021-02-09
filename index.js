const express=require('express')
const mysql=require('mysql');

const app=express();

const db=mysql.createConnection({
    host:'localhost',
    user:'root',
    password:'',
    database:'soica_users'
});

db.connect((err)=>{
    if(err){
        console.log(err);
    }
    else{
        console.log('mysql connected');
    }
});


app.get('/',(req,res)=>{
    res.send("<h1>We are not Home</h1>")
});

app.listen(3000,()=>{
    console.log("Love you 3000");
});
