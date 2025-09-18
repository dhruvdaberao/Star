import mongoose from 'mongoose';

const tribeMessageSchema = mongoose.Schema(
  {
    tribe: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Tribe', 
        required: true 
    },
    sender: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    text: { 
        type: String, 
        required: true 
    },
  },
  {
    timestamps: true,
  }
);

tribeMessageSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  }
});

const TribeMessage = mongoose.model('TribeMessage', tribeMessageSchema);
export default TribeMessage;
