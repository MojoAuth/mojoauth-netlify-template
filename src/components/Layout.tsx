import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="mojoauth-layout">
      <header className="mojoauth-header">
        <div className="logo-container">
          <img 
            src="/assets/mojoauth-logo-light.png" 
            alt="MojoAuth Logo" 
            className="mojoauth-logo" 
          />
          <h1>MojoAuth OIDC Authentication</h1>
        </div>
      </header>
      
      <main className="mojoauth-content">
        {children}
      </main>
      
      <footer className="mojoauth-footer">
        <p>
          Need help? Check out the <a href="https://docs.mojoauth.com" target="_blank" rel="noopener noreferrer">MojoAuth Documentation</a>
        </p>
      </footer>
      
      <style>{`
        .mojoauth-layout {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
          color: #333;
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem;
        }
        
        .mojoauth-header {
          margin-bottom: 2rem;
        }
        
        .logo-container {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        
        .mojoauth-logo {
          width: 50px;
          height: 50px;
        }
        
        h1 {
          font-size: 1.5rem;
          color: #4F46E5;
          margin: 0;
        }
        
        .mojoauth-content {
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          padding: 2rem;
        }
        
        .mojoauth-footer {
          margin-top: 2rem;
          text-align: center;
          font-size: 0.9rem;
          color: #666;
        }
        
        a {
          color: #4F46E5;
          text-decoration: none;
        }
        
        a:hover {
          text-decoration: underline;
        }
        
        @media (prefers-color-scheme: dark) {
          .mojoauth-layout {
            color: #f0f0f0;
            background-color: #1a1a1a;
          }
          
          .mojoauth-content {
            background-color: #2a2a2a;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
          }
          
          h1 {
            color: #818cf8;
          }
          
          .mojoauth-footer {
            color: #aaa;
          }
          
          a {
            color: #818cf8;
          }
        }
      `}</style>
    </div>
  );
};

export default Layout;