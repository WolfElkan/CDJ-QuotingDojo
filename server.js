var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var path = require('path');
var dateformat = require('dateformat');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, './static')));
app.set('views', path.join(__dirname, './views'));
app.set('view engine', 'ejs');
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/quotingDB');

var error_messages = {};

var blank = function(element) {
	return element ? element : '';
}

function validate(obj,field,RE,mess,flag) {
	var val = obj[field];
	if (RE.exec(val)) {
		error_messages[field] = '';
		return val;
	} else {
		error_messages[field] = mess;
		flag.valid = false;
	}
}

var QuoteSchema = new mongoose.Schema({
	content: String,
	author: String,
	created_at: Date,
})
mongoose.model('Quote', QuoteSchema);
var Quote = mongoose.model('Quote');

app.get('/',function(qin,ans) {
	ans.render('index',{error:error_messages,blank:blank})
})

app.post('/add',function(qin,ans) {
	var flag = {valid:true};
	new_quote = new Quote({
		content : validate(qin.body,'quote',/\S+/,'Please enter a quote.',flag),
		author  : validate(qin.body,'name',/\S+/,'Please enter your name.',flag),
		created_at : new Date(),
	})
	if (!flag.valid) {
		ans.redirect('/');
	} else {
		new_quote.save(function(err) {
			if (err) {
				ans.render('error',{h:'Quote could not be saved',p:err});
			} else {
				ans.redirect('/quotes')
			}
		})
	}
})

app.get('/quotes',function(qin,ans) {
	Quote.find({},function(err,result) {
		if (result.length == 0) {
			ans.render('none_yet');
		} else {
			if (err) {
				ans.render('error',{h:'Quotes could not be loaded',p:err})
			} else {
				for (var q in result) {
					result[q].crat_str = dateformat(result[q].created_at,'h:MMtt mmmm d yyyy')
				}
				var dt = result[0].created_at
				ans.render('quotes',{quotes:result});
			}
		}
	}).sort({created_at:-1});
})

app.get('/nuke',function(qin,ans) {
	Quote.remove({},function(err,result) {
		ans.redirect('/')
	});
})

var port = 5000;
app.listen(port, function() {
	console.log("Running at LOCALHOST Port",port);
})