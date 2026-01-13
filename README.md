# AI-Powered Analytics Dashboard

A real-time analytics platform featuring machine learning insights, interactive charts, and predictive modeling. Built with React, TypeScript, Node.js, and Python.

## 🚀 Features

- **Real-time Metrics**: Live data updates via WebSockets
- **Interactive Charts**: Line, bar, scatter, and heatmap visualizations
- **ML Insights**: Predictive modeling and anomaly detection powered by Python/TensorFlow
- **Customizable Dashboard**: Drag-and-drop widget arrangement
- **Automated Reports**: PDF export with charts and ML insights
- **Theme Support**: Light/Dark mode with dynamic color theming

## 📋 Prerequisites

- Node.js (v18+)
- Python (v3.9+)
- PostgreSQL (v14+)
- npm or yarn

## 🛠️ Installation

1. **Install all dependencies:**
   ```bash
   npm run install:all
   ```

2. **Set up PostgreSQL database:**
   ```bash
   # Create database
   createdb analytics_dashboard

   # Run migrations
   cd backend
   npm run migrate

   # Seed data
   npm run seed
   ```

3. **Set up Python ML service:**
   ```bash
   cd python-ml
   pip install -r requirements.txt
   ```

4. **Configure environment variables:**
   - Copy `backend/.env.example` to `backend/.env` and fill in values
   - Copy `python-ml/.env.example` to `python-ml/.env` if needed

## 🏃 Running the Application

**Development mode (runs both frontend and backend):**
```bash
npm run dev
```

**Or run separately:**
```bash
# Terminal 1: Backend
npm run dev:backend

# Terminal 2: Frontend
npm run dev:frontend

# Terminal 3: Python ML Service
cd python-ml
python app.py
```

## 📁 Project Structure

```
.
├── frontend/          # React + TypeScript frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── features/      # Feature-specific components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── services/      # API and WebSocket services
│   │   ├── types/         # TypeScript type definitions
│   │   └── utils/         # Utility functions
│   └── package.json
├── backend/          # Node.js API server
│   ├── src/
│   │   ├── routes/        # API routes
│   │   ├── models/        # Database models
│   │   ├── services/      # Business logic
│   │   ├── websocket/     # WebSocket handlers
│   │   └── utils/         # Utility functions
│   └── package.json
├── python-ml/        # Python ML microservice
│   ├── models/           # ML model definitions
│   ├── services/         # ML prediction services
│   └── app.py            # Flask/FastAPI server
└── database/         # Database scripts
    ├── schema.sql        # Database schema
    └── seed.sql          # Seed data
```

## 🏗️ Architecture

- **Frontend**: React with TypeScript, Chart.js for visualizations, Tailwind CSS for styling
- **Backend**: Node.js/Express API with WebSocket support for real-time updates
- **ML Service**: Python microservice using TensorFlow/scikit-learn for predictions
- **Database**: PostgreSQL for persistent data storage
- **Communication**: REST API between frontend-backend, REST/child_process between backend-Python

## 📝 API Endpoints

### Backend API (Node.js)

#### Metrics
- `GET /api/metrics` - Get all metrics
- `GET /api/metrics/:id` - Get specific metric
- `PUT /api/metrics/:id` - Update metric value
- WebSocket: `metric-update` - Real-time metric updates

#### ML Insights
- `GET /api/ml/insights` - Get ML insights summary
- `POST /api/ml/predict` - Get predictions for metrics
  ```json
  {
    "metricIds": ["metric-1", "metric-2"]
  }
  ```
- `POST /api/ml/anomaly-detection` - Detect anomalies in data
  ```json
  {
    "data": [100, 105, 98, 150, 102]
  }
  ```

### Python ML Service

- `GET /health` - Health check
- `POST /predict` - Generate predictions
- `POST /detect-anomalies` - Detect anomalies
- `GET /insights` - Get service status

## 🎨 Customization

The dashboard supports:
- Drag-and-drop widget rearrangement
- Add/remove widgets dynamically
- Theme customization (light/dark mode)
- Export dashboard as PDF

## 🔧 Development

### Frontend Development
```bash
cd frontend
npm install
npm run dev
```

### Backend Development
```bash
cd backend
npm install
npm run dev
```

### Python ML Service
```bash
cd python-ml
pip install -r requirements.txt
python app.py
```

## 📊 Features in Detail

### Real-time Updates
- WebSocket connection for live metric updates
- Automatic refresh every 5 seconds
- Visual indicators for trend changes

### ML Insights
- **Predictions**: Linear regression-based forecasting
- **Anomaly Detection**: Z-score and Isolation Forest methods
- **Confidence Scores**: Each insight includes confidence level

### Chart Types
- **Line Charts**: Time series data visualization
- **Bar Charts**: Comparative data display
- **Scatter Charts**: Correlation analysis
- **Heatmaps**: Multi-dimensional data representation

### Dashboard Customization
- Drag widgets to rearrange
- Add new widgets from header menu
- Remove widgets with hover controls
- Export current layout as PDF

## 🐛 Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running
- Check `.env` file has correct credentials
- Verify database exists: `createdb analytics_dashboard`

### ML Service Not Responding
- Check Python service is running on port 8000
- Verify dependencies: `pip install -r requirements.txt`
- Check logs for errors

### WebSocket Connection Failed
- Ensure backend is running
- Check CORS settings in backend
- Verify frontend proxy configuration

## 📄 License

MIT

## 🙏 Acknowledgments

Built with:
- React + TypeScript
- Chart.js for visualizations
- Node.js + Express
- Python + scikit-learn
- PostgreSQL
- Socket.io for real-time updates

