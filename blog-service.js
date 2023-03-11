const fs = require("fs");

//---------------GLOBAL ARRAYS POST, CATEGORIES---------------------------------------
let posts = [];
let categories = [];

module.exports.initialize = function() {
    return new Promise((resolve, reject) => {
        fs.readFile('./data/posts.json', 'utf8', (err, data) => {
            if (err) {
                reject('unable to read file');
            } else {
                posts = JSON.parse(data);
                fs.readFile('./data/categories.json', 'utf8', (err, data) => {
                    if (err) {
                        reject('unable to read file');
                    } else {
                        categories = JSON.parse(data);
                        resolve();
                    }
                });

            }
        });

    })
}

module.exports.getAllPosts = function() {
    return new Promise((resolve, reject) => {
        if (posts.length == 0) {
            reject("no message");
        } else {
            resolve(posts);
        }
    });
}


module.exports.getCategories = function() {
    return new Promise((resolve, reject) => {
        if (categories.length == 0) {
            reject("no message");
        } else {
            resolve(categories);
        }
    });
}

//---------------GET PUBLISHED POSTS---------------------------------------
module.exports.getPublishedPosts = function() {
    return new Promise((resolve, reject) => {
        let publishedPosts = posts.filter(post => post.published === true);
        if (posts.length == 0) {
            reject("no message");
        } else {
            resolve(publishedPosts);
        }

    })
}

//---------------GET POSTS BY CATEGORY---------------------------------------
module.exports.getPostsByCategory = (category) => {
    return new Promise(function(resolve, reject) {
        const df = fs.readFileSync('./data/posts.json');
        var publishedPosts = JSON.parse(df);
        var filtered = publishedPosts.filter(a => a.category == category);
        if (filtered.length > 0) {
            resolve(filtered);
        } else {
            reject("no result returned");
        }
    });
};

//---------------GET POSTS BY MIN DATE---------------------------------------
module.exports.getPostsByMinDate = (minDateStr) => {
    return new Promise((resolve, reject) => {
        const df = fs.readFileSync('./data/posts.json');
        var publishedPosts = JSON.parse(df);
        var filtered = publishedPosts.filter(a => new Date(a.postDate) >= new Date(minDateStr));
        if (filtered.length > 0) {
            resolve(filtered);
        } else {
            reject("no result returned");
        }

    });
}

//---------------GET POSTS BY ID ---------------------------------------
module.exports.getPostById = (id) => {
    return new Promise((resolve, reject) => {
        const df = fs.readFileSync('./data/posts.json');
        var publishedPosts = JSON.parse(df);
        var filtered = publishedPosts.filter(a => a.id == id);
        if (filtered.length > 0) {
            resolve(filtered);
        } else {
            reject("no result returned");
        }

    });
}


//TODO Part2 step3
//const posts = require('./posts');

function addPost(postData) {
    return new Promise(function(resolve, reject) {
        if (postData.published == undefined) {
            postData.published = false;
        } else {
            postData.published = true;
        }
        postData.id = posts.length + 1;
        posts.push(postData);
        resolve(posts);
    });
}
module.exports.addPost = addPost;


module.exports.getPublishedPostsByCategory = (category) => {
    return new Promise((resolve, reject) => {
        var filtered = posts.filter(post => post.published == true && post.category == category);
        if (filtered.length > 0) {
            resolve(filtered);
        } else {
            reject("no results returned");
        }
    });
}