# 🔧 Troubleshooting: 500 Internal Server Error

## Problem
You're getting: `500 Internal Server Error` when trying to use the AI Assistant.

## Root Cause
The OpenAI API key is not configured in your `.env` file.

## Solution

### Step 1: Get Your OpenAI API Key
1. Go to https://platform.openai.com/api-keys
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the key (starts with `sk-...`)
5. **Save it somewhere safe** - you can only see it once!

### Step 2: Update the .env File
I've created a `.env` file for you at:
```
backend/.env
```

Open it and replace this line:
```env
OPENAI_API_KEY=your-api-key-here
```

With your actual key:
```env
OPENAI_API_KEY=sk-proj-abc123xyz...
```

### Step 3: Restart the Backend
After updating the `.env` file:

1. **Stop the backend server** (Ctrl+C in the uvicorn terminal)
2. **Restart it**:
   ```bash
   cd backend
   uvicorn app.main:app --reload
   ```

### Step 4: Test Again
1. Go to http://localhost:8080/assistant
2. Try asking a question
3. You should now get a response!

## Verification

### Check the .env File
Your `.env` file should look like this:
```env
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=neo4j123

OPENAI_API_KEY=sk-proj-your-actual-key-here
OPENAI_MODEL=gpt-4o-mini

APP_NAME=ResearchGraph AI
VERSION=0.1.0
DEBUG=True
API_PREFIX=/api/v1
```

### Test the API Key
You can test if your API key is valid by checking the health endpoint:
```
http://localhost:8000/api/v1/assistant/health
```

Should return:
```json
{
  "status": "ok",
  "service": "AI Assistant"
}
```

## Other Potential Issues

### Issue: "OpenAI API key not configured"
**Solution**: Make sure you:
- Created the `.env` file in the `backend` folder (not root)
- Replaced `your-api-key-here` with your actual key
- Restarted the backend server

### Issue: "Invalid API key"
**Solution**: 
- Verify the key is correct (starts with `sk-`)
- Check you copied the entire key
- Make sure there are no extra spaces
- Try creating a new API key

### Issue: "Insufficient credits"
**Solution**:
- Check your OpenAI account has credits
- Add payment method at https://platform.openai.com/account/billing

### Issue: "Rate limit exceeded"
**Solution**:
- You're making too many requests
- Wait a minute and try again
- Check your OpenAI usage limits

## Cost Information

Using **gpt-4o-mini** (default):
- **Very affordable**: ~$0.001-0.003 per query
- **1000 queries**: ~$1-3
- **Initial testing**: Should cost less than $1

### Free Tier
OpenAI usually provides $5 in free credits for new accounts, which is:
- About 1,500-5,000 assistant queries
- More than enough for testing!

## Still Having Issues?

### Check Backend Logs
Look at the terminal running uvicorn for detailed error messages.

### Check Browser Console
1. Open Developer Tools (F12)
2. Go to Console tab
3. Look for error messages

### Test Backend Directly
Try calling the API directly:
```bash
curl -X POST http://localhost:8000/api/v1/assistant/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello"}'
```

### Verify Neo4j
Make sure Neo4j is running and accessible:
```
http://localhost:7474
```

## Quick Checklist

- [ ] Created `.env` file in `backend` folder
- [ ] Added OpenAI API key (starts with `sk-`)
- [ ] Restarted backend server
- [ ] Backend shows no errors in terminal
- [ ] Neo4j is running
- [ ] Frontend is connected to backend

## Next Steps

Once you've added your API key and restarted:
1. The error should be gone
2. Try asking: "Explain the Transformer architecture"
3. You should see a response with sources
4. The assistant is now working! 🎉

---

**Need Help?**
- Check `AI_ASSISTANT_GUIDE.md` for full documentation
- Review `QUICK_START.md` for setup steps
- Make sure all services are running

**Your .env file location:**
```
c:\Users\veere\OneDrive\Desktop\Dev\researchgraph-ai\backend\.env
```

Open it now and add your OpenAI API key! 🔑
