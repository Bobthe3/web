import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

const Resume = () => {
  return (
    <>
      <Helmet>
        <title>Resume - Devan Velji</title>
        <meta name="description" content="Professional resume and experience of Devan Velji." />
      </Helmet>
      
      <div className="container">
        <div className="card frosted-glass">
          <h1>Resume</h1>
          <p>Professional experience and qualifications.</p>
          <div className="back-link">
            <Link to="/">← Back to Home</Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default Resume;