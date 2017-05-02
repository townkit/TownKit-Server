var async = require('async'),
	config = require('config'),
	express = require('express'),
	multer  = require('multer'),
	upload = multer({dest: 'import-uploads'}), //todo: could configure this / use in memory storage
	router = express.Router();

//todo: iterate directory to find importers
var importers = [];
importers['united-kingdom'] = require('../importers/united-kingdom/import.js');

router.post('/', upload.single('sourceFile'), function(req, res, next){

	if(config.importApiKey){
		if(req.body.apiKey != config.importApiKey){
			return res.status(401).send("Import API key incorrect")
		}
	}

	if(!req.body.id){
		return res.status(400).send('Importer id was missing');
	}

	var importer = importers[req.body.id];

	if(!importer){
		return res.status(400).send('Importer not found with id ' + req.body.id);
	}

	var headless = ((!req.body.headless) || (req.body.headless=='true'));

	importer.import(req.file.path, function(err, countTowns){

		//error
		if(err){
			if(headless){
				return res.status(500).send('Error importing: ' + err)
			}
			else{
				return res.render('import-error', {error: err});
			}
		}

		//success
		if(headless){
			return res.send('Done. Saved ' + countTowns +' items.');
		}
		else{
			return res.render('import-success', {numberOfItems: countTowns});
		}
	});
});

router.get('/', function(req, res){

	var model = {
		expectsApiKey: false
	};

	if(config.importApiKey){
		model.expectsApiKey = true;
	}

	return res.render('import', model);
});

module.exports = router;