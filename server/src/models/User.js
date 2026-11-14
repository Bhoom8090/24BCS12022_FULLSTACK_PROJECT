import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [16, 'Username must be at most 16 characters'],
      match: [/^[A-Za-z0-9_]+$/, 'Username can only contain letters, numbers and _'],
    },
    usernameLower: { type: String, required: true, unique: true, index: true },
    passwordHash: {
      type: String,
      required: [function () { return !this.isGuest; }, 'Password is required'],
      select: false,
    },
    isGuest: { type: Boolean, default: false },
    // only set on guests, MongoDB deletes the document after this date
    expiresAt: { type: Date, index: { expireAfterSeconds: 0 } },
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    draws: { type: Number, default: 0 },
    currentStreak: { type: Number, default: 0 },
    bestStreak: { type: Number, default: 0 },
  },
  { timestamps: true }
);

userSchema.methods.toPublic = function () {
  const gamesPlayed = this.wins + this.losses + this.draws;
  return {
    id: this.id,
    username: this.username,
    isGuest: this.isGuest,
    wins: this.wins,
    losses: this.losses,
    draws: this.draws,
    gamesPlayed,
    winRate: gamesPlayed ? Math.round((this.wins / gamesPlayed) * 100) : 0,
    currentStreak: this.currentStreak,
    bestStreak: this.bestStreak,
    createdAt: this.createdAt,
  };
};

export default mongoose.model('User', userSchema);
