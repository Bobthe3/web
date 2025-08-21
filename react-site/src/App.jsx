import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import Home from './pages/Home';
import Gallery from './pages/Gallery';
import Blog from './pages/Blog';
import Resume from './pages/Resume';
import Fitness from './pages/Fitness';
import Map from './pages/Map';
import Navbar from './components/Navbar';
import './styles/theme.css';
import './App.css';

function App() {
  return (
    <HelmetProvider>
      <Router>
        <div className="App">
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/resume" element={<Resume />} />
            <Route path="/fitness" element={<Fitness />} />
            <Route path="/map" element={<Map />} />
          </Routes>
        </div>
      </Router>
    </HelmetProvider>
  );
}

export default App
