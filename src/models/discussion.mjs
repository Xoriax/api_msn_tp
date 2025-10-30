import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  replies: [{
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    created_at: { type: Date, default: Date.now }
  }],
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, { _id: true });

const Schema = new mongoose.Schema({
  linked_to_event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: false },
  linked_to_group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: false },
  messages: [MessageSchema],
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, {
  collection: 'discussions',
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

Schema.pre('save', function validateDiscussionLink(next) {
  if (this.linked_to_event && this.linked_to_group) {
    next(new Error('Une discussion ne peut être liée qu\'à un groupe OU un événement, pas les deux'));
  } else if (!this.linked_to_event && !this.linked_to_group) {
    next(new Error('Une discussion doit être liée à un groupe OU un événement'));
  } else {
    next();
  }
});

export default Schema;
