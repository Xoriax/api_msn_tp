import mongoose from 'mongoose';

const Schema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  icon: { type: String, required: false },
  coverPhoto: { type: String, required: false },
  type: {
    type: String,
    required: true,
    enum: ['public', 'private', 'secret'],
    default: 'public'
  },
  allowMemberPosts: { type: Boolean, default: true },
  allowMemberEvents: { type: Boolean, default: true },
  administrators: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false }],
  discussion_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Discussion', required: false },
  events: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: false }],
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, {
  collection: 'groups',
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
