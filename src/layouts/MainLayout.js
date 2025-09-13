// src/layouts/MainLayout.js
import React from 'react';

export default function MainLayout({ children }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={{ width: '200px', background: '#eee', padding: '1rem' }}>
        <h3>Menu</h3>
        {/* links ou menu lateral aqui */}
      </aside>
      <main style={{ flex: 1, padding: '2rem' }}>
        {children}
      </main>
    </div>
  );
}
