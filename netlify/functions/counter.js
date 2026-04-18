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

// CORS 统一头
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
}

export async function handler(event) {
  // 处理预检请求（必须）
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers
    }
  }

  const database = await connectDB()
  const col = database.collection('visiting')

  // 初始化（防止第一次没有数据）
  await col.updateOne(
    { key: 'total' },
    { $setOnInsert: { count: 0 } },
    { upsert: true }
  )

  // 获取访问量
  if (event.httpMethod === 'GET') {
    const doc = await col.findOne({ key: 'total' })

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ count: doc.count })
    }
  }

  // 增加访问量
  if (event.httpMethod === 'POST') {
    await col.updateOne(
      { key: 'total' },
      { $inc: { count: 1 } }
    )

    const doc = await col.findOne({ key: 'total' })

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ count: doc.count })
    }
  }

  return {
    statusCode: 405,
    headers,
    body: 'Method Not Allowed'
  }
}
