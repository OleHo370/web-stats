import React from 'react';
import { Play } from 'lucide-react';
import GoogleLoginButton from '../auth/GoogleLogin';
import '../App.css';

export default function Login() {
  return (
    <div className="login-screen-wrapper">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo-box">
            <Play fill="white" size={32} />
          </div>
          <h1>WatchStats</h1>
          <p>YouTube Watch History Analytics</p>
        </div>

        <div className="login-content">
          <div className="google-auth-container">
            <GoogleLoginButton />
          </div>

          <div className="login-permissions">
            <p>By signing in, you allow us to:</p>
            <ul>
              <li>Access your YouTube watch history</li>
              <li>View video metadata</li>
              <li>Generate viewing statistics</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}