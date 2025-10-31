import mongoose from 'mongoose';

const Schema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: false },
  event_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  photos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Photo', required: false }],
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, {
  collection: 'albums',
  minimize: false,
  versionKey: false
}).set('toJSON', {
  transform: (doc, ret) => {
    const retUpdated = ret;
    retUpdated.id = ret._id;

    delete retUpdated._id;

    return retUpdated;
  }
});

export default Schema;
