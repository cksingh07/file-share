const mongoose = require('mongoose');

const FileSchema = mongoose.Schema({
    filename: { type: String, required: true },
    path: { type: String, required: true },
    size: { type: Number, required: true },
    uuid: { type: String, required: true },
    sender: { type: String, required: false },
    receiver: { type: String, required: false },
}, { timestamps: true });

const FileModel = mongoose.model('File', FileSchema);

module.exports = {
    File : FileModel,
};
