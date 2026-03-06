import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// CreateLob is now a redirect — the composer bottom sheet is the single entry point.
// Pages that previously linked to /create now open the composer directly via AppLayout.
// This page exists only as a fallback for direct URL access.
const CreateLob = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Navigate home — the composer will be triggered by the calling context
    navigate('/', { replace: true });
  }, [navigate]);

  return null;
};

export default CreateLob;
