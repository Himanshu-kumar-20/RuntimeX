// Use relative /api in production on Vercel or VITE_API_BASE_URL if configured
const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '') + '/api';

export async function checkHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error('Health check failed');
    return await res.json();
  } catch (err) {
    console.error('API health check error:', err);
    throw err;
  }
}

export async function analyzeRepository(githubUrl) {
  const res = await fetch(`${API_BASE}/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ github_url: githubUrl }),
  });

  if (!res.ok) {
    let errorMsg = 'Failed to analyze repository';
    try {
      const errorData = await res.json();
      errorMsg = errorData.detail || errorMsg;
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  return await res.json();
}

export async function fetchAIInsights(issues) {
  const res = await fetch(`${API_BASE}/ai-insights`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ issues }),
  });

  if (!res.ok) {
    let errorMsg = 'Failed to generate AI insights';
    try {
      const errorData = await res.json();
      errorMsg = errorData.detail || errorMsg;
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  return await res.json();
}

export async function executeBatchFix(issues, aiAnalysis, currentScore) {
  const res = await fetch(`${API_BASE}/batch-fix`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      issues,
      ai_analysis: aiAnalysis || [],
      current_score: currentScore,
    }),
  });

  if (!res.ok) {
    let errorMsg = 'Failed to execute batch fix';
    try {
      const errorData = await res.json();
      errorMsg = errorData.detail || errorMsg;
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  return await res.json();
}

export async function optimizeDemo(currentScore, issuesToFix) {
  const res = await fetch(`${API_BASE}/demo-optimize`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      current_score: currentScore,
      issues_to_fix: issuesToFix,
    }),
  });

  if (!res.ok) {
    let errorMsg = 'Failed to optimize demo';
    try {
      const errorData = await res.json();
      errorMsg = errorData.detail || errorMsg;
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  return await res.json();
}
