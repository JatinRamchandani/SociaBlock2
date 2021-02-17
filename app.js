const express=require('express');
const path=require('path')
const bodyParser=require('body-parser');
const app=express();
const fs=require('fs');
const mysql=require('mysql');
const Joi=require('joi');
const multer=require('multer');
const session=require('express-session'); 
const { json } = require('express');
const { type } = require('os');
var MySQLStore = require('express-mysql-session')(session);

app.use('/public',express.static(path.join(__dirname,'static')));
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());

app.set('view engine','ejs');


const db=mysql.createConnection({
    host:'localhost',
    user:'root',
    password:"",
    database:"showMe"
});


const isAuth=(req,res,next)=>{
    if(req.session.isAuth){
        next();
        console.log(req.session.cookie);
    } 
    else{
        res.redirect('/loginForm');
    }
}

const sessionStore=new MySQLStore({},db);

app.use(
    session({
        secret:"secret key to sign cookie",
        resave: false,
        saveUninitialized: false,
        store:sessionStore,
    
    })
);


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
    if(req.session.isAuth){
        res.render("profile3",{username:[req.session.cookie]});
    }
    else{
        res.sendFile(path.join(__dirname,'static','UserRegForm.html'));}
})

app.post('/signup',(req,res)=>{
    
    let userFName=req.body.fname;
    let userLName=req.body.lname;
    let userEmail=req.body.Email;
    let userPass=req.body.password;
    let date=req.body.date;


    let newmail="";
    let videoTable="";
    
    let sql='INSERT INTO users SET FName=?, LName=?, Email=? ,DOB= ?, Password= ?, Profiles=?, Imagetable=?, Videotable=?';


    for (var i =0;i<userEmail.length-4;i++){
        if(userEmail.charAt(i)=='@'){
            newmail+='$';
        }
        else{
            newmail+=userEmail.charAt(i);
        }
    }


    for (var i =0;i<userEmail.length-4;i++){
        if(userEmail.charAt(i)=='@'){

            numbertoAdd=(newmail.length)*(userLName.length);
            videoTable+=numbertoAdd.toString();
        }
        else{
            videoTable+=userEmail.charAt(i);
        }
    }
    

    let sql2 = "CREATE TABLE "+newmail+" (id INT AUTO_INCREMENT PRIMARY KEY, Image VARCHAR(255), Caption VARCHAR(255))";
    let sql3 = "CREATE TABLE "+videoTable+" (id INT AUTO_INCREMENT PRIMARY KEY, Video VARCHAR(255), Caption VARCHAR(255))";



    let query=db.query(sql,[userFName,userLName,userEmail,date,userPass,,newmail,videoTable],(err,result)=>{
        if(err) throw err;
        console.log(req.body);
        res.sendFile(path.join(__dirname,'static','UserRegForm.html'));
      
    })
    db.query(sql2,(err, result)=>{
        if (err) throw err;
        console.log("Image Table created");
      })
    db.query(sql3,(err, result)=>{
        if (err) throw err;
        console.log("Video Table created");
      })

})

app.get('/loginForm',(req,res)=>{
    console.log(req.params);
    res.sendFile(path.join(__dirname,'static','login.html'));
});


app.get("/login1/:email/:pass",isAuth,(req,res)=>{
    let Email=req.params.email;
    let Password=req.params.pass;
    var sql="SELECT FName,LName,Email,Profiles FROM users WHERE Email = ? AND Password = ?";
    db.query(sql,[Email,Password],(err,result)=>{
        if(err) throw err;
        console.log(result);
        res.render("profile2",{username:result});
    });
    

})


app.get('/wall',(req,res)=>{

    res.render('wall',{username:[{FName:req.session.cookie.FName}]});
});


app.post('/wall',(req,res)=>{
   
    console.log(req.session);
    console.log(req.session.cookie);
    console.log(req.session.id);
    let Email=req.body.Email;
    let Password=req.body.Password;
    var sql="SELECT FName,LName,Email,Password,Profiles,Imagetable,Videotable FROM users WHERE Email = ? AND Password = ?";
    db.query(sql,[Email,Password],(err,result)=>{
        if(err) throw err;
        req.session.isAuth=true;
        req.session.cookie=result[0];

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
        res.render("searchresults",{users:result});
        
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

    sql3= 'UPDATE posts SET profilephoto=? WHERE Email=?';
    db.query(sql3,[pathnew,email],(err,result)=>{
        if(err) throw err;
        console.log(result);
    });
    let FName=req.session.cookie.FName;
    let LName=req.session.cookie.LName;
    let username=FName+" "+LName;
    let profilephoto=pathnew;
    let caption=FName+" updated profile picture ";

    sql4='INSERT INTO posts SET Username=?, Email=?, profilephoto=?, Post=?, PostImage=?';
    db.query(sql4,[username,email,profilephoto,caption,pathnew],(err,result)=>{
        if(err) throw err;
        console.log(result);
    });

    req.session.cookie.Profiles=pathnew;

    sql2= 'SELECT * FROM users WHERE Email= ?';
    db.query(sql2,email,(err,result)=>{
        if(err) throw err;
        console.log(result);
        res
            .status(200)
            .render("profile3",{username:result});
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
    let email=req.session.cookie.Email;
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

    var sql="SELECT Image,Caption FROM "+newmail;

    db.query(sql,(err,result)=>{
        if(err) throw err;
        console.log(result);
        res.render("photos",{username:req.session.cookie.FName,userphoto:photo,all:result});
    })

    console.log("photo cookie cshoa");
    console.log(req.session.cookie);
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
    let toAdd=req.session.cookie.Email;
    let photo=req.params.profile;
    let caption=req.body.capt;

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

    sql= 'INSERT INTO '+ newmail +' SET Image = ?, Caption=?';
    const targetPath = path.join(__dirname, "./individualImages/:newtempPath.jpg");
    db.query(sql,[newpathnew,caption],(err,result)=>{
        if(err) throw err;
        console.log(result);
    });

   
    var sql="SELECT Image,Caption FROM "+newmail;

    db.query(sql,(err,result)=>{
        if(err) throw err;
        console.log(result);
        res
            .status(200)
            .render("photos",{username:toAdd,userphoto:photo,all:result});
    });

        //  res
        //     .status(200)
        //     .render("photos",{username:toAdd,userphoto:photo});
});


app.get("/addPosts",(req,res)=>{
    res.sendFile(path.join(__dirname,"static","addPosts.html"));
})


app.post("/storePost",upload.single("image"),(req,res)=>{
    let post=req.body.Post;
    let newpathnew;
    if(req.file!=null){
        let image=req.file.path;
        newpathnew=image.substr(7,image.length);
    }
    else{
        newpathnew=null;
    }
    let email=req.session.cookie.Email;
    let profilephoto=req.session.cookie.Profiles;
    let username=req.session.cookie.FName+" "+req.session.cookie.LName;


    var sql="INSERT INTO posts SET Username=?, Email= ?, profilephoto=?, Post= ?, PostImage=?";

    db.query(sql,[username,email,profilephoto,post,newpathnew],(err,result)=>{
        if(err) throw err;
        console.log(result);
    });


    var sql2="SELECT * FROM posts ORDER BY Id DESC";
    db.query(sql2,(err,result)=>{
        if(err) throw err;
        console.log(result);
        res.redirect("addPosts");
    });


    //////////////////////////////////////////////


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
    sql="SELECT * FROM posts WHERE Email = ? ORDER BY Id DESC";
    db.query(sql,email,(err,result)=>{
        if (err) throw err;
        console.log(result);

        res.render("myposts",{all:result})

    })
})

app.get("/othersmyposts/:email",(req,res)=>{
    
    let email=req.params.email;
    sql="SELECT * FROM posts WHERE Email = ? ORDER BY Id DESC";
    
    db.query(sql,email,(err,result)=>{
        if (err) throw err;
        console.log(result);

        res.render("othersmyposts",{all:result})

    })
})


app.get('/logout',(req,res)=>{
    req.session.destroy((err)=>{
        if (err) throw err;
        res.redirect('/loginForm');
    })
})

//Video upload and display goes here



const upload2 = multer({
    dest: "./videos"
  });

app.post("/uploadvideos",upload2.single("video"),(req,res)=>{
    let newtempPath = req.file.path;
    let userEmail=req.session.cookie.Email;
    let userLName=req.session.cookie.LName;
    // let caption=req.body.capt;


    let newmail="";
    
    for (var i =0;i<userEmail.length-4;i++){
        if(userEmail.charAt(i)=='@'){
            newmail+='$';
        }
        else{
            newmail+=userEmail.charAt(i);
        }
    }

    let videoTable="";

    for (var i =0;i<userEmail.length-4;i++){
        if(userEmail.charAt(i)=='@'){

            numbertoAdd=(newmail.length)*(userLName.length);
            videoTable+=numbertoAdd.toString();
        }
        else{
            videoTable+=userEmail.charAt(i);
        }
    }

    
    let newpathnew=newtempPath.substr(7,newtempPath.length);

    sql= 'INSERT INTO '+ videoTable +' SET Video = ?';
    // const targetPath = path.join(__dirname, "./individualImages/:newtempPath.jpg");
    db.query(sql,newpathnew,(err,result)=>{
        if(err) throw err;
        console.log(result);
    });

   
    var sql="SELECT Video FROM "+videoTable;

    db.query(sql,(err,result)=>{
        if(err) throw err;
        console.log(result);
        res
            .status(200)
            .render("videos",{username:req.session.cookie.FName,all:result});
    })

        //  res
        //     .status(200)
        //     .render("photos",{username:toAdd,userphoto:photo});
})

app.get("/videos/:id", (req, res) => {
    let s1 = "./videos/" + req.params.id;
    res.sendFile(path.join(__dirname, s1));
  });


app.get("/videos",(req,res)=>{
    let userEmail=req.session.cookie.Email;
    let userLName=req.session.cookie.LName;

    let newmail="";
    
    for (var i =0;i<userEmail.length-4;i++){
        if(userEmail.charAt(i)=='@'){
            newmail+='$';
        }
        else{
            newmail+=userEmail.charAt(i);
        }
    }

    let videoTable="";

    for (var i =0;i<userEmail.length-4;i++){
        if(userEmail.charAt(i)=='@'){

            numbertoAdd=(newmail.length)*(userLName.length);
            videoTable+=numbertoAdd.toString();
        }
        else{
            videoTable+=userEmail.charAt(i);
        }
    }

    var sql="SELECT Video FROM "+videoTable;

    db.query(sql,(err,result)=>{
        if(err) throw err;
        console.log(result);
        res.render("videos",{username:req.session.cookie.FName,all:result});
    });
});


app.post("/videos/delete/:video",(req,res)=>{
    let userEmail=req.session.cookie.Email;
    let userLName=req.session.cookie.LName;
    let video=req.params.video;

    let newmail="";
    
    for (var i =0;i<userEmail.length-4;i++){
        if(userEmail.charAt(i)=='@'){
            newmail+='$';
        }
        else{
            newmail+=userEmail.charAt(i);
        }
    }

    let videoTable="";

    for (var i =0;i<userEmail.length-4;i++){
        if(userEmail.charAt(i)=='@'){

            numbertoAdd=(newmail.length)*(userLName.length);
            videoTable+=numbertoAdd.toString();
        }
        else{
            videoTable+=userEmail.charAt(i);
        }
    }

    var sql="DELETE FROM "+ videoTable +" WHERE Video = ? " ;

    db.query(sql,video,(err,result)=>{
        if(err) throw err;
        console.log(result);
    })

    
    var sql="SELECT Video FROM "+videoTable;

    db.query(sql,(err,result)=>{
        if(err) throw err;
        console.log(result);
        res
            .status(200)
            .render("videos",{username:req.session.cookie.FName,all:result});
    })
});



app.get('/profile3',(req,res)=>{

    Email=req.session.cookie.Email;
    Password=req.session.cookie.Password;
    var sql="SELECT FName,LName,Email,Profiles FROM users WHERE Email = ? AND Password = ?";
    db.query(sql,[Email,Password],(err,result)=>{
        if(err) throw err;
        console.log(result);
        res.render("profile3",{username:result});
    });
});



app.get('/openprofile/:email',(req,res)=>{

    let email=req.params.email;

    let sql='SELECT * FROM users where Email=?';
    db.query(sql,email,(err,result)=>{
        if (err) console.log(err);
        else{
            res.render('others',{username:result});
        }

    })
});


app.get('/othersvideos/:videotable',(req,res)=>{

    let videotable=req.params.videotable;

    let sql='SELECT * FROM '+ videotable ;
    db.query(sql,(err,result)=>{
        if (err) console.log(err);
        else{
            res.render('othersvideos',{all:result});
        }
    })
});





app.listen(3000);
