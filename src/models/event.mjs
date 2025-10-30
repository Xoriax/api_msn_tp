import mongoose from 'mongoose';

const Schema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  location: { type: String, required: true },
  coverPhoto: { type: String, required: false },
  isPrivate: { type: Boolean, default: false },
  is_public: { type: Boolean, default: true },
  organizers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false }],
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: false },
  albums: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Album', required: false }],
  polls: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Poll', required: false }],
  discussion_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Discussion', required: false },
  has_ticketing: { type: Boolean, default: false },
  ticket_types: [{ type: mongoose.Schema.Types.ObjectId, ref: 'TicketType', required: false }],
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, {
  collection: 'events',
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
