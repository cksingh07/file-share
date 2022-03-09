const express = require('express');
const multer = require('multer');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { File } = require('../Models/File');
const path = require('path');
const fs = require('fs');


//Configuration for Multer
const multerStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "public");
    },
    filename: (req, file, cb) => {
      const ext = file.mimetype.split("/")[1];
      cb(null, `uploads/${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`);
    },
});

//Calling the "multer" Function
const upload = multer({
    storage: multerStorage,
    limits:{ fileSize: 1000000 * 100 },
    // fileFilter: multerFilter,
});

async function fetchAndDeleteData() {
    const filesToBeRemove = await File.find({ createdAt : { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000)} })
    if(filesToBeRemove.length) {
        for (const file of filesToBeRemove) {
            try {
                fs.unlinkSync(file.path);
                await file.remove();
                console.log(`successfully deleted ${file.filename}`);
            } catch(err) {
                console.log(`error file ${err} `);
            }
        }
    }
    console.log('Completed!');
}


router.get('/:uuid', async (req, res) => {
    fetchAndDeleteData();

    const file = await File.findOne({ uuid: req.params.uuid });

    // Link expired
    if(!file) {
         return res.render('downloadfile', { error: 'Link expired.'});
    } 
    const response = await file.save();
    const filePath = `${__dirname}/../${file.path}`;
    res.download(filePath);
});

router.post('/upload' , upload.single('fileupload') ,async (req,res) => {
    try {
        const fileData = req.file;
        const file = new File({
            filename: fileData.filename,
            uuid: uuidv4(),
            path: fileData.path,
            size: fileData.size
        });
        const response = await file.save();
        res.json({status : true, file: `${process.env.APP_BASE_URL}/file/${response.uuid}`});
    
    } catch (error) {
        console.log(error);
    }
})

router.post('/send', async (req, res) => {
    const { uuid, emailTo, emailFrom, expiresIn } = req.body;
    if(!uuid || !emailTo || !emailFrom) {
        return res.status(422).send({ error: 'All fields are required except expiry.'});
    }

     // Get data from db 
    try {
        const file = await File.findOne({ uuid: uuid });
        if(file.sender) {
        return res.status(422).send({ error: 'Email already sent once.'});
        }
        file.sender = emailFrom;
        file.receiver = emailTo;
        const response = await file.save();
        // send mail
        const sendMail = require('../services/mailService');
        sendMail({
            from: emailFrom,
            to: emailTo,
            subject: 'ShareFiles file sharing',
            text: `${emailFrom} shared a file with you.`,
            html: require('../services/emailTemplate')({
                    emailFrom, 
                    downloadLink: `${process.env.APP_BASE_URL}/files/${file.uuid}?source=email` ,
                    size: parseInt(file.size/1000) + ' KB',
                    expires: '24 hours'
                })
        }).then(() => {
            return res.json({success: true});
        }).catch(err => {
            return res.status(500).json({error: 'Error in email sending.'});
        });
    } catch(err) {
        return res.status(500).send({ error: 'Something went wrong.'});
    }
})

module.exports = router;