import { MongoClient } from 'mongodb'

const uri = process.env.MONGODB_URI

let client
let db

async function connectDB() {
  if (!client) {
    client = new MongoClient(uri)
    await client.connect()
    db = client.db('kyodou')
  }
  return db
}

export async function handler(event) {
  const database = await connectDB()
  const col = db.collection('visiting')

  // 初始化（防止第一次没有数据）
  await col.updateOne(
    { key: 'total' },
    { $setOnInsert: { count: 0 } },
    { upsert: true }
  )

  if (event.httpMethod === 'GET') {
    const doc = await col.findOne({ key: 'total' })
    return {
      statusCode: 200,
      body: JSON.stringify({ count: doc.count })
    }
  }

  if (event.httpMethod === 'POST') {
    await col.updateOne(
      { key: 'total' },
      { $inc: { count: 1 } }
    )

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    }
  }

  return { statusCode: 405 }
}
