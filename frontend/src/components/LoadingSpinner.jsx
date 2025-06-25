// components/LoadingSpinner.js
import CircularProgress from '@mui/material/CircularProgress';

export default function LoadingSpinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 50 }}>
      <CircularProgress />
    </div>
  );
}