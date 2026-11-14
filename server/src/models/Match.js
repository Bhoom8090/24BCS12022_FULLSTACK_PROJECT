import mongoose from 'mongoose';

const playerSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    username: { type: String, required: true },
    symbol: { type: String, enum: ['X', 'O'], required: true },
  },
  { _id: false }
);

const matchSchema = new mongoose.Schema(
  {
    players: { type: [playerSchema], validate: (v) => v.length === 2 },
    winner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    result: { type: String, enum: ['win', 'draw'], required: true },
    reason: { type: String, enum: ['normal', 'forfeit'], default: 'normal' },
    moves: [{ _id: false, symbol: String, index: Number }],
  },
  { timestamps: true }
);

matchSchema.index({ 'players.user': 1, createdAt: -1 });

export default mongoose.model('Match', matchSchema);
