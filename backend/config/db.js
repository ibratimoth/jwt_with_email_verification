import mongoose from 'mongoose';
import dotenv from 'dotenv'

dotenv.config()

export const connectDb = mongoose.createConnection(process.env.MONGO_URL).on('open', () => {
    console.log('Successfully connected to mongodb')
}).on('error', () => {
    console.log('Mongodb connection error')
})

