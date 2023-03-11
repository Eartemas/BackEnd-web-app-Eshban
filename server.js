/*********************************************************************************
 *  WEB322 – Assignment 03
 *  I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part *  of this assignment has been copied manually or electronically from any other source 
 *  (including 3rd party web sites) or distributed to other students.
 * 
 *  Name: Eshban Artemas Student ID: 15769218 Date: 02-18-2023
 *
 *  Online (Cyclic) Link: https://rich-blue-chiton-fez.cyclic.app/about
 ********************************************************************************/

const express = require('express');
const app = express();
const path = require("path");
const exphbs = require('express-handlebars');
const blogService = require("./blog-service");
const stripJs = require('strip-js');

const cloudinary = require('cloudinary').v2;
const multer = require("multer");
const streamifier = require('streamifier');

const HTTP_PORT = process.env.PORT || 8080;

// Config
cloudinary.config({
    cloud_name: "dcnqjksuy",
    api_key: "766462514461559",
    api_secret: "3dbjFYbmwgZ2PWI5zPyXrBmGm8c",
    secure: true,
})

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





function onHttpStart() {
    console.log("Express http server listening on:  " + HTTP_PORT);
}

app.use(express.static('public'));

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
app.get("/posts/add", (req, res) => {
    res.render(path.join(__dirname + "/views/addPost.hbs"));
});
app.get('/posts/:id', (req, res) => {
    blogService.getPostById(req.params.id).then((data) => {
        res.send(data);
    }).catch((err) => {
        res.send("No Result Found");
    })
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
blogService.initialize().then(() => {
    app.listen(HTTP_PORT, onHttpStart);

}).catch(() => {
    console.log("error");
});