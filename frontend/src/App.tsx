import { Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './state/AppContext';
import { InputPage } from './pages/InputPage';
import { LoadingPage } from './pages/LoadingPage';
import { ResultPage } from './pages/ResultPage';

function App() {
  return (
    <AppProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/input" replace />} />
        <Route path="/input" element={<InputPage />} />
        <Route path="/loading" element={<LoadingPage />} />
        <Route path="/result" element={<ResultPage />} />
        <Route path="*" element={<Navigate to="/input" replace />} />
      </Routes>
    </AppProvider>
  );
}

export default App;
