/*********************************************************************************
 *  WEB322 
 *  I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part *  of this assignment has been copied manually or electronically from any other source 
 *  (including 3rd party web sites) or distributed to other students.
 * 
 *  Name: Eshban Artemas Date: 24/3/2023
 *
 *  Online (Cyclic) Link: https://tough-chicken.cyclic.app/blog
 ********************************************************************************/

const express = require('express');
const app = express();
const path = require("path");
const exphbs = require('express-handlebars');
const blogService = require("./blog-service");
const stripJs = require('strip-js');
var authData = require('./auth-service')
const cloudinary = require('cloudinary').v2;
const multer = require("multer");
const streamifier = require('streamifier');
const clientSessions = require("client-sessions");
const HTTP_PORT = process.env.PORT || 8080;

// Config
cloudinary.config({
    cloud_name: "dcnqjksuy",
    api_key: "766462514461559",
    api_secret: "3dbjFYbmwgZ2PWI5zPyXrBmGm8c",
    secure: true,
})

app.use(clientSessions({
    cookieName: "session",
    secret: "week10example_web322",
    duration: 2 * 60 * 1000,
    activeDuration: 1000 * 60
}));

app.use(function(req, res, next) {
    res.locals.session = req.session;
    next();
});

function ensureLogin(req, res, next) {
    if (!req.session.user) {
        res.redirect("/login");
    } else {
        next();
    }
}

const upload = multer(); // upload variable with no disk storage {storage:storage}



app.engine('.hbs', exphbs.engine({
    extname: '.hbs',
    defaultLayout: 'main',

    helpers: {
        navLink: function(url, options) {
            return '<li' +
                ((url == app.locals.activeRoute) ? ' class="active" ' : '') +
                '><a href="' + url + '">' + options.fn(this) + '</a></li>';
        },
        safeHTML: function(context) {
            return stripJs(context);

        },

        equal: function(lvalue, rvalue, options) {
            if (arguments.length < 3)
                throw new Error("Handlebars Helper equal needs 2 parameters");
            if (lvalue != rvalue) {
                return options.inverse(this);
            } else {
                return options.fn(this);
            }
        },
        formatDate: (dateObj) => {
            let year = dateObj.getFullYear();
            let month = (dateObj.getMonth() + 1).toString();
            let day = dateObj.getDate().toString();
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }

    }
}));


app.use(function(req, res, next) {
    let route = req.path.substring(1);
    app.locals.activeRoute = "/" + (isNaN(route.split('/')[1]) ? route.replace(/\/(?!.*)/, "") : route.replace(/\/(.*)/, ""));
    app.locals.viewingCategory = req.query.category;
    next();
});


app.set('view engine', '.hbs');

app.use(express.urlencoded({ extended: true }));




app.use(express.static('public'));

// Login

app.get("/login", (req, res) => {
    res.render("login");
});

// Register

app.get("/register", (req, res) => {
    res.render("register");
});

app.post("/register", (req, res) => {
    authData.registerUser(req.body)
        .then(() => res.render("register", { successMessage: "User created" }))
        .catch(err => res.render("register", { errorMessage: err, userName: req.body.userName }))
});

app.post("/login", (req, res) => {
    req.body.userAgent = req.get('User-Agent');
    authData.checkUser(req.body).then((user) => {
        req.session.user = {
            userName: user.userName,
            email: user.email,
            loginHistory: user.loginHistory
        }
        res.redirect('/posts');
    }).catch((err) => {
        res.render("login", { errorMessage: err, userName: req.body.userName });
    });
});

// Logout

app.get("/logout", (req, res) => {
    req.session.reset();
    res.redirect("/");
});

// Get User History

app.get("/userHistory", ensureLogin, (req, res) => {
    res.render("userHistory");
});



app.get('/', (req, res) => {
    res.redirect('/blog');
});

// -------------------ABOUT--------------------------------------------
app.get("/about", (req, res) => {
    res.render(path.join(__dirname + "/views/about.hbs"));
});

// -------------------BLOG--------------------------------------------
app.get('/blog', async(req, res) => {
    var viewData = { post: {}, posts: [] };
    try {
        let posts = [];
        if (req.query.category) {
            posts = await blogService.getPostsByCategory(req.query.category);
        } else {
            posts = await blogService.getAllPosts();
        }
        posts.sort((a, b) => new Date(b.postDate) - new Date(a.postDate));
        let post = posts[0];
        viewData.posts = posts;
        viewData.post = post;

    } catch (err) {
        viewData.message = "no results";
    }
    try {
        let categories = await blogService.getCategories();
        viewData.categories = categories;
    } catch (err) {
        viewData.categoriesMessage = "no results"
    }
    console.log(viewData.post);
    res.render("blog", { data: viewData })
});


app.get('/blog/:id', async(req, res) => { 
    var viewData = { post: {}, posts: [] };
    try {
        let posts = [];
        if (req.query.category) {
            posts = await blogService.getPublishedPostsByCategory(req.query.category);
        } else {
            posts = await blogService.getPublishedPosts();
        }
        posts.sort((a, b) => new Date(b.postDate) - new Date(a.postDate));
        viewData.posts = posts;
    } catch (err) {
        viewData.message = "no results";
    }
    try {
        viewData.post = await blogService.getPostById(req.params.id);
    } catch (err) {
        viewData.message = "no results";
    }
    try {
        let categories = await blogService.getCategories();
        viewData.categories = categories;
    } catch (err) {
        viewData.categoriesMessage = "no results"
    }
    res.render("blog", { data: viewData })
});

// -------------------POSTS--------------------------------------------
app.get("/posts", (req, res) => {
    let category = req.query.category;
    let minDate = req.query.minDate;
    if (category) {
        blogService.getPostsByCategory(category).then(data => {
            if (data.length > 0) {
                res.render("posts", { posts: data });
            } else {
                res.render("posts", { message: "no results" });
            }
        })
    } else if (minDate != "" && minDate != null) {
        blogService.getPostsByMinDate(minDate).then(data => {
            if (data.length > 0) {
                res.render("posts", { posts: data });
            } else {
                res.render("posts", { message: "no results" });
            }
        })
    } else {
        blogService.getAllPosts().then(data => {
            if (data.length > 0) {
                res.render("posts", { posts: data });
            } else {
                res.render("posts", { message: "no results" });
            }
        })
    }
});

app.get('/posts/add', (req, res) => {

    blogService.getCategories()
        .then(data => res.render("addPost", { categories: data }))
        .catch(err => {
            res.render("addPost", { categories: [] })
            console.log(err);
        });

});

app.get('/posts/:id', (req, res) => {
    blogService.getPostById(req.params.id).then((data) => {
        res.send(data);
    }).catch((err) => {
        res.send("No Result Found");
    })
});

app.get("/posts/delete/:id", (req, res) => {
    blogService.deletePostById(req.params.id)
        .then(() => {
            res.redirect("/posts");
        }).catch(err => {
            res.status(500).send("Unable to Remove Post / Post not found");
            console.log(err);
        });
});




// -------------------CATEGORIES--------------------------------------------
app.get("/categories", (req, res) => {
    blogService.getCategories().then(data => {
        if (data.length > 0) {
            res.render("categories", { categories: data });
        } else {
            res.render("categories", { message: "no results" });
        }
    })
});


app.get("/categories/add", (req, res) => {
    res.render(path.join(__dirname, "/views/addCategory.hbs"));
});


app.post("/categories/add", (req, res) => {
    blogService.addCategory(req.body).then(() => {
        res.redirect("/categories");
    })
});

app.get("/categories/delete/:id", (req, res) => {
    blogService.deleteCategoryById(req.params.id)
        .then(() => {
            res.redirect("/categories");
        }).catch(err => {
            res.status(500).send("Unable to Remove Category / Category not found");
            console.log(err);
        });
});

// -------------------Add Posts--------------------------------------------



app.post("/posts/add", upload.single("featureImage"), (req, res) => {

    let streamUpload = (req) => {
        return new Promise((resolve, reject) => {
            let stream = cloudinary.uploader.upload_stream(
                (error, result) => {
                    if (result) {
                        resolve(result);
                    } else {
                        reject(error);
                    }
                }
            );

            streamifier.createReadStream(req.file.buffer).pipe(stream);
        });
    };

    async function upload(req) {
        let result = await streamUpload(req);
        console.log(result);
        return result;
    }

    upload(req).then((uploaded) => {
        req.body.featureImage = uploaded.url;
        // TODO: Process the req.body and add it as a new Blog Post before redirecting to /posts

        var postData = req.body;
        blogService.addPost(postData).then(data => {
            res.redirect('/posts');
        }).catch(err => {
            res.send(err);
        });


    });


});


// 404
app.get("*", (req, res) => {
        res.status(404).render(path.join(__dirname + "/views/pageNotFound.hbs"));
    }) // if no matching route is found default to 404 with message "Page Not Found"


//LISTEN

blogService.initialize()
    .then(authData.initialize)
    .then(function() {
        app.listen(HTTP_PORT, function() {
            console.log("app listening on: " + HTTP_PORT)
        });
    }).catch(function(err) {
        console.log("unable to start server: " + err);
    });
