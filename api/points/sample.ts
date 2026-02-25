import { VercelRequest, VercelResponse } from '@vercel/node';

// Redirect to Blob URL directly if available
// This is much faster than proxying the stream.
const BLOB_BASE_URL = process.env.BLOB_BASE_URL;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { frame, file } = req.query;
  const frameIdx = parseInt((frame as string) || '0', 10);
  const drive = (file as string) || '2011_09_26_drive_0001_sync';
  const frameStr = frameIdx.toString().padStart(10, '0');

  // Lidar Path in Blob
  const blobPath = `${drive}/velodyne_points/data/${frameStr}.bin`;

  if (BLOB_BASE_URL) {
    // 302 Found -> Redirect to Blob URL
    const url = `${BLOB_BASE_URL}/${blobPath}`;
    res.setHeader('Access-Control-Allow-Origin', '*');
    // If frontend supports follow redirect, this works. 
    // Or we can return the URL and let frontend fetch.
    // For THREE.js loaders, usually we pass the URL.
    // But current frontend expects binary data. So let's redirect.
    return res.redirect(302, url);
  }

  // Fallback (e.g. mock empty data if no blob configured)
  res.status(404).send('No Blob Configured');
}