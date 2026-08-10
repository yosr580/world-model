import axios from 'axios'

export const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

export async function runTest(modelId: string, testId: string) {
  const response = await api.post(`/tests/run?model_id=${modelId}&test_id=${testId}`)
  return response.data
}

export async function sendChatMessage(message: string) {
  const response = await api.post('/chat/message', { message })
  return response.data
}
