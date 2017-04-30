var async = require('async'),
	config = require('config'),
	express = require('express'),
	multer  = require('multer'),
	upload = multer({dest: '../import-uploads'}),
	router = express.Router();

//later, will iterate directory to find importers
var importers = [];
importers['united-kingdom'] = require('../importers/united-kingdom/import.js');

router.post('/', upload.single('sourceFile'), function(req, res, next){

	var expectedImportApiKey = config.importApiKey;
	var providedImportApiKey = req.get('X-Import-Api-Key');

	if(expectedImportApiKey){
		if(providedImportApiKey != expectedImportApiKey){
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

	importer.import(req.file.path, function(err){

		if(err){
			return res.status(500).send('Error importing - ', err);
		}
		
		return res.send('Done');
	})
});

module.exports = router;