import mongoose from 'mongoose';

const Schema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  quantityLimit: { type: Number, required: true, min: 1 },
  quantity_sold: { type: Number, default: 0, min: 0 },
  event_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  is_active: { type: Boolean, default: true },
  description: { type: String, required: false },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, {
  collection: 'ticket_types',
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
