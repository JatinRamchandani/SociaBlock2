const express=require('express');
const path=require('path')
const bodyParser=require('body-parser');
const app=express();
const fs=require('fs');
const mysql=require('mysql');
const Joi=require('joi');
const multer=require('multer');
const session=require('express-session'); 

app.use('/public',express.static(path.join(__dirname,'static')));
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());

app.use(
    session({
        secret:"secret key to sign cookie",
        resave: false,
        saveUninitialized: false,
    })
);


app.set('view engine','ejs');


const db=mysql.createConnection({
    host:'localhost',
    user:'root',
    password:"",
    database:"showMe"
});



db.connect((err)=>{
    if(err){
       console.log(err);
    }

    else{
        console.log('mysql connected..')
    }

})

app.get('/',(req,res)=>{
    console.log(req.params);
    res.sendFile(path.join(__dirname,'static','UserRegForm.html'));
})

app.post('/signup',(req,res)=>{
    
    let userFName=req.body.fname;
    let userLName=req.body.lname;
    let userEmail=req.body.Email;
    let userPass=req.body.password;
    let date=req.body.date;
    
    let newmail="";
    let sql='INSERT INTO users SET FName=?, LName=?, Email=? ,DOB= ?, Password= ?, Profiles=?, Imagetable=?';


    for (var i =0;i<userEmail.length-4;i++){
        if(userEmail.charAt(i)=='@'){
            newmail+='$';
        }
        else{
            newmail+=userEmail.charAt(i);
        }
    }
    

    let sql2 = "CREATE TABLE "+newmail+" (id INT AUTO_INCREMENT PRIMARY KEY, Image VARCHAR(255), Caption VARCHAR(255))";

    let query=db.query(sql,[userFName,userLName,userEmail,date,userPass,,newmail],(err,result)=>{
        if(err) throw err;
        console.log(req.body);
        res.sendFile(path.join(__dirname,'static','UserRegForm.html'));
      
    })
    db.query(sql2,(err, result)=>{
        if (err) throw err;
        console.log("Table created");
      })
})

app.get('/loginForm',(req,res)=>{
    console.log(req.params);
    res.sendFile(path.join(__dirname,'static','login.html'));
});


app.get("/login1/:email/:pass",(req,res)=>{
    let Email=req.params.email;
    let Password=req.params.pass;
    var sql="SELECT FName,LName,Email,Profiles FROM users WHERE Email = ? AND Password = ?";
    db.query(sql,[Email,Password],(err,result)=>{
        if(err) throw err;
        console.log(result);
        res.render("profile",{username:result});
    });
    

})


app.get('/login',(req,res)=>{

    console.log(req.session);
    console.log(req.session.id);
    let Email=req.query.Email;
    let Password=req.query.Password;
    var sql="SELECT FName,LName,Email,Password,Profiles FROM users WHERE Email = ? AND Password = ?";
    db.query(sql,[Email,Password],(err,result)=>{
        if(err) throw err;
        console.log(result);
        res.render("wall",{username:result});
    });
});



app.get("/search",(req,res)=>{
    let nuser=req.query.searchuser;

    var sql="SELECT FName,LName,Email,Profiles FROM users WHERE FName= ? ";
    db.query(sql,nuser,(err,result)=>{
        if(err) throw err;
        console.log(result);
        res.render("others",{username:result});
        
    })
})


const handleError = (err, res) => {
    res
      .status(500)
      .contentType("text/plain")
      .end("Oops! Something went wrong!");
  };

  const upload = multer({
    dest: "./images"
  });


app.post("/upload/:email",upload.single("image"),(req,res)=>{
    var tempPath = req.file.path;
    let email=req.params.email;

    let pathnew=tempPath.substr(7,tempPath.length);

    sql= 'UPDATE users SET Profiles=? WHERE Email= ?';
    const targetPath = path.join(__dirname, "./images/:tempPath.jpg");
    db.query(sql,[pathnew,email],(err,result)=>{
        if(err) throw err;
        console.log(result);
    });

    sql2= 'SELECT * FROM users WHERE Email= ?';
    db.query(sql2,email,(err,result)=>{
        if(err) throw err;
        console.log(result);
        res
            .status(200)
            .render("profile",{username:result});
    });
         
    

    // if (path.extname(req.file.originalname).toLowerCase() === ".jpeg") {
    //     fs.rename(tempPath, targetPath, err => {
    //       if (err) return handleError(err, res);
  
    //       res
    //         .status(200)
    //         .contentType("text/plain")
    //         .send("File uploaded!");
    //     });
    //   } else {
    //     fs.unlink(tempPath, err => {
    //       if (err) return handleError(err, res);
  
    //       res
    //         .status(403)
    //         .contentType("text/plain")
    //         .end("Only .png files are allowed!");
    //     });
    //   }
});

app.get("/images/:id", (req, res) => {
    let s1 = "./images/" + req.params.id;
    res.sendFile(path.join(__dirname, s1));
  });



app.post("/images/delete/:name/:profile/:image",(req,res)=>{
    let email=req.params.name;
    let image=req.params.image;
    let profile=req.params.profile;

    let newmail="";
    
    for (var i =0;i<email.length-4;i++){
        if(email.charAt(i)=='@'){
            newmail+='$';
        }
        else{
            newmail+=email.charAt(i);
        }
    }

    var sql="DELETE FROM "+ newmail +" WHERE Image = ? " ;

    db.query(sql,image,(err,result)=>{
        if(err) throw err;
        console.log(result);
    })

    
    var sql="SELECT Image FROM "+newmail;

    db.query(sql,(err,result)=>{
        if(err) throw err;
        console.log(result);
        res
            .status(200)
            .render("photos",{username:email,userphoto:profile,all:result});
    })
});



app.get("/photos/:email/:profile",(req,res)=>{
    let para=req.params.email;
    let photo=req.params.profile;
    let newmail="";
    
    for (var i =0;i<para.length-4;i++){
        if(para.charAt(i)=='@'){
            newmail+='$';
        }
        else{
            newmail+=para.charAt(i);
        }
    }

    var sql="SELECT Image FROM "+newmail;

    db.query(sql,(err,result)=>{
        if(err) throw err;
        console.log(result);
        res.render("photos",{username:para,userphoto:photo,all:result});
    })

   
})


app.get("/othersphotos/:email/:profile",(req,res)=>{
    let para=req.params.email;
    let photo=req.params.profile;
    let newmail="";
    
    for (var i =0;i<para.length-4;i++){
        if(para.charAt(i)=='@'){
            newmail+='$';
        }
        else{
            newmail+=para.charAt(i);
        }
    }
    var sql="SELECT Image FROM "+newmail;

    db.query(sql,(err,result)=>{
        if(err) throw err;
        console.log(result);
        res.render("othersPhotos",{username:para,userphoto:photo,all:result});
    })

   
})


app.post("/uploadphotos/:email/:profile",upload.single("image"),(req,res)=>{
    let newtempPath = req.file.path;
    let toAdd=req.params.email;
    let photo=req.params.profile;
    // let caption=req.body.capt;

    let newmail="";

    for (var i =0;i<toAdd.length-4;i++){
        if(toAdd.charAt(i)=='@'){
            newmail+='$';
        }
        else{
            newmail+=toAdd.charAt(i);
        }
    }

    

    let newpathnew=newtempPath.substr(7,newtempPath.length);

    sql= 'INSERT INTO '+ newmail +' SET Image = ?';
    const targetPath = path.join(__dirname, "./individualImages/:newtempPath.jpg");
    db.query(sql,newpathnew,(err,result)=>{
        if(err) throw err;
        console.log(result);
    });

   
    var sql="SELECT Image FROM "+newmail;

    db.query(sql,(err,result)=>{
        if(err) throw err;
        console.log(result);
        res
            .status(200)
            .render("photos",{username:toAdd,userphoto:photo,all:result});
    })

        //  res
        //     .status(200)
        //     .render("photos",{username:toAdd,userphoto:photo});
})


app.get("/addPosts",(req,res)=>{
    res.sendFile(path.join(__dirname,"static","addPosts.html"));
})


app.post("/storePost",(req,res)=>{
    let pos=req.body;

    var sql="INSERT INTO posts SET ? ";

    db.query(sql,pos,(err,result)=>{
        if(err) throw err;
        console.log(result);
    });


    var sql2="SELECT * FROM posts ORDER BY Id DESC";
    db.query(sql2,(err,result)=>{
        if(err) throw err;
        console.log(result);
        res.render("posts",{allresults:result});
    });
})


app.get("/wallposts",(req,res)=>{
    
    var sql2="SELECT * FROM posts ORDER BY Id DESC";
    db.query(sql2,(err,result)=>{
        if(err) throw err;
        console.log(result);
        res.render("posts",{allresults:result});
    });
})


app.get("/myposts/:email",(req,res)=>{
    
    let email=req.params.email;
    sql="SELECT * FROM posts WHERE Email = ?";
    db.query(sql,email,(err,result)=>{
        if (err) throw err;
        console.log(result);

        res.render("myposts",{all:result})

    })
})

app.get("/othersmyposts/:email",(req,res)=>{
    
    let email=req.params.email;
    sql="SELECT * FROM posts WHERE Email = ?";
    db.query(sql,email,(err,result)=>{
        if (err) throw err;
        console.log(result);

        res.render("othersmyposts",{all:result})

    })
})



app.listen(3000);
















