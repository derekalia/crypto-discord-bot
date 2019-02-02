const mongoose = require('mongoose');
const { Schema } = mongoose;

const postSchema = new Schema({
  title: String,
  description: String,
  media: String,
  link: String,
  author: String,
  authorAddress: String,
  tip: Number,
  walletAddress: String,
  votes: { type: Number, default: 0 },
  linkTitle: String,
  free: Boolean,
  request: Boolean,
  type: String,
  amount: Number,
  sticky: { type: Boolean, default: false },
  NSFW: { type: Boolean, default: false },
  duration: Date,
  goal: { type: Number },
  raised: { type: Number },
  tokenId: { type: String },
  fundraiserTiers: [
    {
      title: { type: String },
      description: { type: String },
      media: { type: String },
      price: { type: Number },
      users: [{ type: String }],
      index: { type: Number, required: true }
    }
  ],
  submissionsArray: [
    {
      mediaUrl: { type: String, required: true },
      userId: { type: Schema.Types.ObjectId, required: true },
      username: { type: String, required: true },
      index: { type: Number, required: true },
      submitted: { type: Date, required: true }
    }
  ],
  selectedSubmission: { type: Number, default: null },
  restricted: Array,
  public: Boolean,
  tribeLink: String,
  tribeName: String,
  tribeId: Schema.Types.ObjectId,
  linkUUID: String,
  _user: { type: Schema.Types.ObjectId, ref: 'User' },
  _comments: [{ type: Schema.Types.ObjectId, ref: 'Comment' }],
  dateCreated: { type: Date, default: Date.now() },
  dateUpdated: { type: Date, default: Date.now() }
});

mongoose.model('Post', postSchema);
