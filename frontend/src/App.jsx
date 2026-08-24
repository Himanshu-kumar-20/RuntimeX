import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import HeroInput from './components/HeroInput';
import LoadingAnalysis from './components/LoadingAnalysis';
import ScoreOverview from './components/ScoreOverview';
import CategoryScores from './components/CategoryScores';
import OptimizationBanner from './components/OptimizationBanner';
import IssueExplorer from './components/IssueExplorer';
import IssueModal from './components/IssueModal';
import ReanalyzeOverlay from './components/ReanalyzeOverlay';
import FixAllOverlay from './components/FixAllOverlay';
import AIUnavailableBanner from './components/AIUnavailableBanner';
import ReportModal from './components/ReportModal';
import { checkHealth, analyzeRepository, optimizeDemo, fetchAIInsights, executeBatchFix } from './services/api';
import './App.css';

const DEMO_URL = 'https://github.com/demo-owner/RuntimeXDemoApp';

function isDemoUrl(url) {
  return url && url.toLowerCase().includes('demo');
}

export default function App() {
  const [backendConnected, setBackendConnected] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAILoading, setIsAILoading] = useState(false);
  const [error, setError] = useState(null);

  const [analysisData, setAnalysisData] = useState(null);
  const [originalData, setOriginalData] = useState(null);
  const [currentRepoUrl, setCurrentRepoUrl] = useState(null);

  // Track which issues have been locally fixed
  const [fixedIssueIds, setFixedIssueIds] = useState([]);

  // For the "Simulate All" optimization banner
  const [isOptimized, setIsOptimized] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);

  // For Apply Fix single-issue flow
  const [isApplyingFix, setIsApplyingFix] = useState(false);
  const [applyingIssueId, setApplyingIssueId] = useState(null);
  const [showReanalyzeOverlay, setShowReanalyzeOverlay] = useState(false);
  const [prevScore, setPrevScore] = useState(null);

  // Fix All Issues Flow state
  const [isFixingAll, setIsFixingAll] = useState(false);
  const [showFixAllOverlay, setShowFixAllOverlay] = useState(false);
  const [fixAllSummary, setFixAllSummary] = useState(null);

  // Selected issue modal
  const [selectedIssue, setSelectedIssue] = useState(null);

  // Report modal
  const [showReportModal, setShowReportModal] = useState(false);

  // Health check
  useEffect(() => {
    async function verifyBackend() {
      try {
        await checkHealth();
        setBackendConnected(true);
      } catch {
        setBackendConnected(false);
      }
    }
    verifyBackend();
    const interval = setInterval(verifyBackend, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleAnalyze = async (url) => {
    setError(null);
    setIsAnalyzing(true);
    setIsAILoading(false);
    setFixedIssueIds([]);
    setIsOptimized(false);
    setSelectedIssue(null);
    setShowReportModal(false);
    setShowFixAllOverlay(false);
    setPrevScore(null);

    try {
      // Step 1: Fast Static Analysis + Scoring (Returns in ~1-2 seconds)
      const data = await analyzeRepository(url);
      
      // Render dashboard IMMEDIATELY
      setAnalysisData(data);
      setOriginalData(data);
      setCurrentRepoUrl(url);
      setIsAnalyzing(false);

      setTimeout(() => {
        document.getElementById('analysis-results')?.scrollIntoView({ behavior: 'smooth' });
      }, 80);

      // Step 2: Asynchronous Gemini AI Background Enrichment
      if (data.issues && data.issues.length > 0) {
        setIsAILoading(true);
        try {
          const aiRes = await fetchAIInsights(data.issues);
          if (aiRes && aiRes.ai_analysis) {
            setAnalysisData((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                ai_analysis: aiRes.ai_analysis,
                ai_available: aiRes.ai_available,
              };
            });
          }
        } catch (aiErr) {
          console.warn('[App] AI insights background fetch error (fallback maintained):', aiErr);
          setAnalysisData((prev) => (prev ? { ...prev, ai_available: false } : prev));
        } finally {
          setIsAILoading(false);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to analyze repository. Check the URL and backend status.');
      setIsAnalyzing(false);
      setIsAILoading(false);
    }
  };

  const handleRunDemo = () => handleAnalyze(DEMO_URL);

  // Primary "Fix All Issues" flow
  const handleFixAll = async () => {
    if (!analysisData || !analysisData.issues || analysisData.issues.length === 0) return;

    setIsFixingAll(true);
    setPrevScore(analysisData.score);
    setShowFixAllOverlay(true);

    try {
      const isDemo = isDemoUrl(currentRepoUrl);

      if (isDemo) {
        // Demo Mode 43 -> 78 flow
        const allOptimizable = ['demo-issue-1', 'demo-issue-2', 'demo-issue-4'];
        const optimized = await optimizeDemo(analysisData.score, allOptimizable);
        setFixedIssueIds(allOptimizable);
        setAnalysisData(optimized);
        setIsOptimized(true);

        setFixAllSummary({
          fixed_count: 3,
          remaining_count: 1,
          needs_review_count: 1, // StaticContextLeak needs manual review
          initial_score: 43,
          new_score: 78,
        });
      } else {
        // Real repository batch fix flow via POST /api/batch-fix
        const res = await executeBatchFix(
          analysisData.issues,
          analysisData.ai_analysis,
          analysisData.score
        );

        setFixedIssueIds((prev) => [...new Set([...prev, ...res.fixed_issue_ids])]);
        setAnalysisData({
          ...analysisData,
          score: res.new_score,
          rating: res.rating,
          categories: res.categories,
          summary: res.summary,
          issues: res.remaining_issues,
          ai_analysis: res.ai_analysis,
        });

        setFixAllSummary({
          fixed_count: res.fixed_count,
          remaining_count: res.remaining_count,
          needs_review_count: res.needs_review_count,
          initial_score: res.initial_score,
          new_score: res.new_score,
        });
      }
    } catch (err) {
      console.error('Fix all failed:', err);
    } finally {
      setIsFixingAll(false);
    }
  };

  const handleCloseFixAllOverlay = () => {
    setShowFixAllOverlay(false);
    setFixAllSummary(null);
  };

  // Apply a single fix and re-score via the backend demo-optimize or simple re-calculation
  const handleApplyFix = useCallback(async (issue) => {
    if (!analysisData || fixedIssueIds.includes(issue.id)) return;

    const isDemo = isDemoUrl(currentRepoUrl);

    setApplyingIssueId(issue.id);
    setIsApplyingFix(true);
    setPrevScore(analysisData.score);
    setSelectedIssue(null); // close modal

    await new Promise((r) => setTimeout(r, 150));
    setShowReanalyzeOverlay(true);

    try {
      const newFixed = [...fixedIssueIds, issue.id];

      if (isDemo) {
        const optimized = await optimizeDemo(analysisData.score, newFixed);
        setFixedIssueIds(newFixed);
        setAnalysisData(optimized);
        const allOptimizable = ['demo-issue-1','demo-issue-2','demo-issue-5','demo-issue-6','demo-issue-8','demo-issue-9'];
        const allDone = allOptimizable.every((id) => newFixed.includes(id));
        if (allDone) setIsOptimized(true);
      } else {
        const remainingIssues = analysisData.issues.filter(
          (iss) => !newFixed.includes(iss.id)
        );
        const remainingAi = analysisData.ai_analysis.filter(
          (ai) => !newFixed.includes(ai.issue_id)
        );
        const severityPoints = { HIGH: 12, MEDIUM: 7, LOW: 3 };
        const gained = severityPoints[issue.severity] || 5;
        const newScore = Math.min(100, analysisData.score + gained);

        const summaryCount = { critical: 0, high: 0, medium: 0, low: 0 };
        remainingIssues.forEach((i) => {
          if (i.severity === 'HIGH') summaryCount.high++;
          else if (i.severity === 'MEDIUM') summaryCount.medium++;
          else if (i.severity === 'LOW') summaryCount.low++;
        });

        const getRating = (s) => {
          if (s >= 90) return 'Excellent';
          if (s >= 75) return 'Good';
          if (s >= 50) return 'Needs Improvement';
          return 'Poor';
        };

        setFixedIssueIds(newFixed);
        setAnalysisData({
          ...analysisData,
          score: newScore,
          rating: getRating(newScore),
          issues: remainingIssues,
          ai_analysis: remainingAi,
          summary: summaryCount,
        });
      }
    } catch (err) {
      console.error('Apply fix failed:', err);
    } finally {
      await new Promise((r) => setTimeout(r, 1400));
      setShowReanalyzeOverlay(false);
      setIsApplyingFix(false);
      setApplyingIssueId(null);
    }
  }, [analysisData, fixedIssueIds, currentRepoUrl]);

  // Bulk "Simulate All" via banner — uses demo-optimize endpoint
  const handleOptimizeDemo = async () => {
    if (!analysisData) return;
    setIsOptimizing(true);
    setPrevScore(analysisData.score);
    try {
      const allOptimizable = ['demo-issue-1', 'demo-issue-2', 'demo-issue-4'];
      const optimized = await optimizeDemo(analysisData.score, allOptimizable);
      setFixedIssueIds(allOptimizable);
      setAnalysisData(optimized);
      setIsOptimized(true);
    } catch (err) {
      console.error('Demo optimization failed:', err);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleResetToInitial = () => {
    if (originalData) {
      setAnalysisData(originalData);
      setFixedIssueIds([]);
      setIsOptimized(false);
      setPrevScore(null);
    }
  };

  const handleResetAll = () => {
    setAnalysisData(null);
    setOriginalData(null);
    setCurrentRepoUrl(null);
    setError(null);
    setFixedIssueIds([]);
    setIsOptimized(false);
    setSelectedIssue(null);
    setShowReportModal(false);
    setShowFixAllOverlay(false);
    setPrevScore(null);
    setIsAILoading(false);
  };

  const selectedAiAnalysis = selectedIssue
    ? analysisData?.ai_analysis?.find((item) => item.issue_id === selectedIssue.id)
    : null;

  const isDemo = isDemoUrl(currentRepoUrl);

  return (
    <div className="terminal-workspace">
      {/* Subtle Vignette Ambient */}
      <div className="crt-vignette"></div>

      {/* Main Terminal Window Frame */}
      <div className="terminal-window">
        {/* Terminal Titlebar with Traffic Lights & Path */}
        <Navbar
          backendConnected={backendConnected}
          onReset={analysisData ? handleResetAll : null}
          onRunDemo={handleRunDemo}
          isAnalyzing={isAnalyzing}
        />

        {/* Terminal Content Body */}
        <main className="terminal-body">
          {/* AI Status Banner if Gemini unavailable */}
          {analysisData && analysisData.ai_available === false && (
            <AIUnavailableBanner />
          )}

          {/* Terminal Command Input (Hero) */}
          <HeroInput
            onAnalyze={handleAnalyze}
            isAnalyzing={isAnalyzing}
            error={error}
          />

          {/* Loading Stream Console */}
          {isAnalyzing && <LoadingAnalysis />}

          {/* Diagnostic Results Console */}
          {analysisData && !isAnalyzing && (
            <div id="analysis-results" className="results-console">
              {/* Score Overview Spec & CRT Meter */}
              <ScoreOverview
                data={analysisData}
                prevScore={prevScore}
                githubUrl={currentRepoUrl}
                isOptimized={isOptimized}
                onOpenReport={() => setShowReportModal(true)}
                onFixAll={handleFixAll}
                isFixingAll={isFixingAll}
              />

              {/* 5 Subsystem Performance Meters */}
              <CategoryScores
                categories={analysisData.categories}
                issues={analysisData.issues}
              />

              {/* Optimization Panel (for Demo Mode) */}
              {isDemo && (
                <OptimizationBanner
                  isOptimized={isOptimized}
                  onOptimize={handleOptimizeDemo}
                  onResetToInitial={handleResetToInitial}
                  isOptimizing={isOptimizing}
                  currentScore={analysisData.score}
                />
              )}

              {/* Terminal Issue Explorer */}
              <IssueExplorer
                issues={analysisData.issues}
                aiAnalysis={analysisData.ai_analysis}
                onSelectIssue={(issue) => setSelectedIssue(issue)}
                onApplyFix={handleApplyFix}
                fixedIssueIds={fixedIssueIds}
                isOptimized={isOptimized}
                isAILoading={isAILoading}
              />
            </div>
          )}
        </main>

        {/* Terminal Footer */}
        <footer className="terminal-footer">
          <div>
            <span>[SYS: RUNTIMEX_CORE v2.5.0]</span> — BATCH REMEDIATION &amp; ASYNC AI ENGINE
          </div>
          <div className="footer-tags">
            <span className="footer-tag">TERM: VT100</span>
            <span className="footer-tag">STATUS: IDLE</span>
            <span className="footer-tag">BATCH_FIX: READY</span>
          </div>
        </footer>
      </div>

      {/* Re-analyze overlay */}
      {showReanalyzeOverlay && (
        <ReanalyzeOverlay
          prevScore={prevScore}
          newScore={analysisData?.score}
        />
      )}

      {/* Fix All Step Progress & Summary Overlay */}
      {showFixAllOverlay && (
        <FixAllOverlay
          initialScore={prevScore}
          summaryData={fixAllSummary}
          onFinish={handleCloseFixAllOverlay}
        />
      )}

      {/* Terminal Diagnostic Deep-Dive Modal */}
      {selectedIssue && (
        <IssueModal
          issue={selectedIssue}
          aiAnalysis={selectedAiAnalysis}
          onClose={() => setSelectedIssue(null)}
          onApplyFix={handleApplyFix}
          isApplyingFix={isApplyingFix && applyingIssueId === selectedIssue?.id}
          isFixed={fixedIssueIds.includes(selectedIssue?.id)}
          isAILoading={isAILoading}
        />
      )}

      {/* Terminal Audit Report Modal */}
      {showReportModal && analysisData && (
        <ReportModal
          data={analysisData}
          githubUrl={currentRepoUrl}
          isOptimized={isOptimized}
          prevScore={prevScore}
          onClose={() => setShowReportModal(false)}
        />
      )}
    </div>
  );
}
