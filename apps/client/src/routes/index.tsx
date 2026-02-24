import { createBrowserRouter } from 'react-router-dom';
import Dashboard from '../pages/Dashboard';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Dashboard />,
  },
  {
    path: '/docs/*', // Allow docs to be handled by server/static files, but Client Router might intercept.
    // Actually, React Router intercepts all routes.
    // If /docs is a static HTML folder, we need to bypass React Router or configure it.
    // A simple way is to use a reload for /docs to let the server serve the static file.
    loader: () => { window.location.href = '/docs/index.html'; return null; }
  }
]);
