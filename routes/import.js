var async = require('async'),
	express = require('express'),
	multer  = require('multer'),
	upload = multer({dest: '../import-uploads'}),
	router = express.Router();

//later, will iterate directory to find importers
var importers = [];
importers['united-kingdom'] = require('../importers/united-kingdom/import.js');

router.post('/', upload.single('sourceFile'), function(req,res,next){

	if(!req.body.id){
		return res.status(400).send('Importer id was missing');
	}

	var importer = importers[req.body.id];

	if(!importer){
		return res.status(400).send('Importer not found with id ' + req.body.id);
	}

	importer.import(req.file.path, function(err){
		return res.send('Done');
	})
});

module.exports = router;