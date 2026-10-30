1. Start the backend (Terminal 1)
Open PowerShell in VS Code / Antigravity:
cd "D:\chrome download\BI documents\lumoon\lumoon\server"


Install dependencies (only if not installed):
npm install


Start the server:
npm start


Expected output should indicate MongoDB connected and the backend running on port 5000.
2. Start the frontend (Terminal 2)
Open a second terminal:
cd "D:\chrome download\BI documents\lumoon\lumoon\client"


Install dependencies (only if not installed):
npm install


Start Vite:
npm run dev


3. Open your website
LUMOON Storefront

http://localhost:5173/
Open LUMOON
4. Your terminal setup
Terminal	Application	Port
Terminal 1	Express backend	5000
Terminal 2	React + Vite	5173

Important:
- Keep both terminals running.
- Make sure your server/.env contains your MongoDB Atlas URI.
- Don't run node seed.js every time you start the project. Run it only when you intentionally need to update product data.