import { Route, Routes } from 'react-router-dom'
import StartPage from './pages/StartPage'
import OnboardingPage from './pages/OnboardingPage'
import InterviewPage from './pages/InterviewPage'
import ProcessingPage from './pages/ProcessingPage'
import ResultPage from './pages/ResultPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<StartPage />} />
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route path="/interview/:sessionId" element={<InterviewPage />} />
      <Route path="/processing/:sessionId" element={<ProcessingPage />} />
      <Route path="/result/:sessionId" element={<ResultPage />} />
    </Routes>
  )
}
