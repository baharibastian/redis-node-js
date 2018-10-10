'use strict'

const express = require('express');
const app = express();
const request = require('superagent');
const redis = require('redis');
const client = redis.createClient();

const respond =(username, repositories) => {
	return `Users "${username}" has ${repositories} public repositories.`;
}

const getUserRepos = (req, res) => {
	let username = req.query.username;
	request.get(`https://api.github.com/users/${username}/repos`, function(err, response) {
		if (err) {
			res.send({message: 'Something Went Wrong', error: err});
		} else {	
			let repoLength = response.body.length;
			client.setex(username, 60, repoLength);
			res.send(respond(username, repoLength));
		}
	})
}

function cache(req, res, next) {
    const username = req.query.username;
    client.get(username, function (err, data) {
        if (err) throw err;

        if (data != null) {
            res.send(respond(username, data));
        } else {
            next();
        }
    });
}


app.get('/users', cache, getUserRepos);
app.listen(3000, function() {
	console.log('node-redis app listening to port 3000');
})