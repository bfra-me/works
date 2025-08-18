import express from 'express'

const app = express()
const port = process.env.PORT || 3000

app.use(express.json())

app.get('/', (req, res) => {
  res.json({ message: 'Hello from <%= it.name %>!' })
})

app.listen(port, () => {
  console.log(`Server running on port ${port}`)
})
