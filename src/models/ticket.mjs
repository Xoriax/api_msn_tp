import mongoose from 'mongoose';

const BuyerInfoSchema = new mongoose.Schema({
  firstname: { type: String, required: true },
  lastname: { type: String, required: true },
  email: { type: String, required: true },
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    postal_code: { type: String, required: true },
    country: { type: String, required: true }
  }
}, { _id: false });

const Schema = new mongoose.Schema({
  ticket_type_id: { type: mongoose.Schema.Types.ObjectId, ref: 'TicketType', required: true },
  event_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  buyerInfo: BuyerInfoSchema,
  purchase_date: { type: Date, default: Date.now },
  ticket_number: { type: String, required: true, unique: true },
  is_used: { type: Boolean, default: false },
  used_at: { type: Date, required: false },
  created_at: { type: Date, default: Date.now }
}, {
  collection: 'tickets',
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

Schema.pre('save', function generateTicketNumber(next) {
  if (!this.ticket_number) {
    this.ticket_number = `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  }
  next();
});

export default Schema;
