import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

const Blog = () => {
  return (
    <>
      <Helmet>
        <title>Blog - Devan Velji</title>
        <meta name="description" content="Thoughts, experiences, and insights on photography, fitness, technology, and life." />
      </Helmet>
      
      <div className="container">
        <div className="card frosted-glass">
          <h1>Blog</h1>
          <p>Coming soon - thoughts on photography, fitness, technology, and life.</p>
          <div className="back-link">
            <Link to="/">← Back to Home</Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default Blog;