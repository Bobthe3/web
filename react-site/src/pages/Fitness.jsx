import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

const Fitness = () => {
  return (
    <>
      <Helmet>
        <title>Fitness - Devan Velji</title>
        <meta name="description" content="Fitness journey, triathlon training, and wellness insights from Devan Velji." />
      </Helmet>
      
      <div className="container">
        <div className="card frosted-glass">
          <h1>Fitness</h1>
          <p>My fitness journey, triathlon training, and wellness insights.</p>
          <div className="back-link">
            <Link to="/">← Back to Home</Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default Fitness;