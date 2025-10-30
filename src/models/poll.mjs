import mongoose from 'mongoose';

const OptionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  votes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { _id: true });

const QuestionSchema = new mongoose.Schema({
  question_text: { type: String, required: true },
  options: [OptionSchema],
  created_at: { type: Date, default: Date.now }
}, { _id: true });

const Schema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: false },
  event_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  questions: [QuestionSchema],
  is_active: { type: Boolean, default: true },
  endDate: { type: Date, required: false },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, {
  collection: 'polls',
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
