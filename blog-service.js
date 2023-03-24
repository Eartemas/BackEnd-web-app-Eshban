//---------------CONNECTION / MODELS ---------------------------------------
const Sequelize = require('sequelize');

var sequelize = new Sequelize('exjucbrw', 'exjucbrw', 'pdkLEKYNEt0ctsl0aCSGB40O23ec2FIQ', {
    host: 'ruby.db.elephantsql.com',
    database: 'exjucbrw',
    username: 'exjucbrw',
    password: 'pdkLEKYNEt0ctsl0aCSGB40O23ec2FIQ',
    dialect: 'postgres',
    port: 5432,
    dialectOptions: {
        ssl: { rejectUnauthorized: false }
    },
    query: { raw: true }
});


sequelize
    .authenticate()
    .then(function() {
        console.log('Connection has been established successfully.');
    })
    .catch(function(err) {
        console.log('Unable to connect to the database:', err);
    });


// Models
const Post = sequelize.define('Post', {
    body: Sequelize.TEXT,
    title: Sequelize.STRING,
    postDate: Sequelize.DATE,
    featureImage: Sequelize.STRING,
    published: Sequelize.BOOLEAN
});


const Category = sequelize.define('Category', {

    category: Sequelize.STRING
});

Post.belongsTo(Category, {
    foreignKey: 'category'
});

module.exports.initialize = function() {
    return new Promise(function(resolve, reject) {
        sequelize.sync()
            .then(() => {
                resolve("database synced");
            })
            .catch(() => {
                reject("unable to sync database");
            })
    });
}

module.exports.getAllPosts = function() {
    return new Promise(function(resolve, reject) {
        Post.findAll()
            .then((data) => {
                let err = 5 / 0;
                resolve(data);
            })
            .catch(() => {
                reject("no results returned");
            })
    });
}

module.exports.getCategories = function() {
    return new Promise((resolve, reject) => {
        Category.findAll()
            .then((data) => {
                resolve(data);
            })
            .catch(() => {
                reject("no results returned");
            })
    });
}

module.exports.addCategory = (categoryData) => {
    return new Promise(function(resolve, reject) {
        // ensure all empty attributes are set to null
        for (var a in categoryData) {
            if (categoryData[a] == "") {
                categoryData[a] = null;
            }
        }
        Category.create(categoryData)
            .then(resolve())
            .catch(reject('unable to create category'))
    });
};

module.exports.deleteCategoryById = (id) => {
    return new Promise((resolve, reject) => {
        Category.destroy({
                where: {
                    id: id
                }
            })
            .then(resolve())
            .catch(reject('unable to delete category'))
    })
};
//---------------GET PUBLISHED POSTS---------------------------------------
module.exports.getPublishedPosts = function() {
    return new Promise((resolve, reject) => {
        Post.findAll({
                where: {
                    published: true
                }
            })
            .then((data) => {
                resolve(data);
            })
            .catch(() => {
                reject("no results returned")
            })
    });
}

//---------------GET POSTS BY CATEGORY---------------------------------------
module.exports.getPostsByCategory = (category) => {
    return new Promise(function(resolve, reject) {
        Post.findAll({
                where: {
                    category: category
                }
            })
            .then((data) => {
                resolve(data);
            })
            .catch(() => {
                reject("no results returned")
            })
    });
};

//---------------GET POSTS BY MIN DATE---------------------------------------
module.exports.getPostsByMinDate = (minDateStr) => {
    return new Promise((resolve, reject) => {
        const { gte } = Sequelize.Op;

        Post.findAll({
            where: {
                postDate: {
                    [gte]: new Date(minDateStr)
                }
            }
        }).then(data => {
            resolve(data);
        }).catch(err => {
            reject("no results returned");
        });

    });
}

//---------------GET POSTS BY ID ---------------------------------------
module.exports.getPostById = (id) => {
    return new Promise(function(resolve, reject) {
        Post.findAll({
                where: {
                    id: id
                }
            })
            .then((data) => {
                resolve(data[0]);
            })
            .catch(() => {
                reject("no results returned")
            })
    });
}


//TODO Part2 step3
//const posts = require('./posts');

module.exports.addPost = (postData) => {
    return new Promise((resolve, reject) => {
        postData.published = (postData.published) ? true : false;
        for (const prop in postData) {
            if (postData[prop] === "") {
                postData[prop] = null;
            }
        }

        postData.postDate = new Date();

        Post.create({
                id: postData.id,
                title: postData.title,
                body: postData.body,
                postDate: postData.postDate,
                category: postData.category,
                featureImage: postData.featureImage,
                published: postData.published
            })
            .then(resolve())
            .catch(reject('unable to create post'))
    });
};


module.exports.deletePostById = (id) => {
    return new Promise((resolve, reject) => {
        Post.destroy({
                where: {
                    id: id
                }
            })
            .then(() => {
                resolve()
            })
            .catch(() => {
                reject('unable to delete post')
            })
    })
};


module.exports.getPostById = (id) => {
    return new Promise(function(resolve, reject) {
        Post.findAll({
                where: {
                    id: id
                }
            })
            .then((data) => {
                resolve(data[0]);
            })
            .catch(() => {
                reject("no results returned")
            })
    });
}