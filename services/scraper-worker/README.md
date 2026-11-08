# Dedicated Scraper Worker Microservice

This standalone microservice runs the off-campus crawling engines (**LinkedIn Guest**, **Internshala**, and **Google Jobs / Serper**) with an Indian IP address to bypass Cloudflare and AWS datacenter blocks.

---

### Deployment on a ₹400/month VPS (AWS Lightsail Mumbai / DigitalOcean Bangalore)

#### 1. Setup Environment
```bash
git clone <your-repo>
cd services/scraper-worker
npm install
```

#### 2. Configure `.env`
```env
PORT=4000
WORKER_AUTH_KEY=your_secure_worker_secret
SUPABASE_URL=https://jcnbjmesqyplzlvfoapc.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SERPER_API_KEY=your_serper_api_key
```

#### 3. Run with Docker or PM2
```bash
# Using PM2
npm run build
pm2 start dist/server.js --name "placeme-scraper"

# Or using Docker
docker build -t placeme-scraper .
docker run -d -p 4000:4000 --env-file .env --name placeme-scraper placeme-scraper
```

#### 4. Endpoints Provided
- `POST /api/v1/crawl`: Accepts `{ query: string, location: string }` and synchronizes discovered jobs with Supabase `discovered_jobs_lake`.
- `GET /health`: Health-check endpoint for uptime monitoring.
