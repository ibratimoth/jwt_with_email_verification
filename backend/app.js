import express from 'express'
import dotenv from 'dotenv'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import authRoutes from './routes/authRoutes.js'
import './config/db.js'

dotenv.config()
const app = express()

app.use(express.json()) // allows us to parse incoming requests:req.body
app.use(express.urlencoded({extended: false}))
app.use(morgan('dev'))
app.use(cookieParser())// allows us to parse incoming cookies

app.get('/', (req,res) => {
    res.send('<h1>Hello world</h1>')
})

app.use('/api/auth', authRoutes)

const PORT = process.env.PORT || 6002

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})