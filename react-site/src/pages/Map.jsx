import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

const Map = () => {
  return (
    <>
      <Helmet>
        <title>Map - Devan Velji</title>
        <meta name="description" content="Interactive map showing places I've visited and photographed." />
      </Helmet>
      
      <div className="container">
        <div className="card frosted-glass">
          <h1>Map</h1>
          <p>Interactive map showing places I've visited and photographed.</p>
          <div className="back-link">
            <Link to="/">← Back to Home</Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default Map;