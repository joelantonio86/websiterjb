import { useAudio } from '../../contexts/AudioContext'
import Header from './Header'
import Footer from './Footer'
import LoadingOverlay from '../LoadingOverlay'
import MessageBox from '../MessageBox'
import ScrollToTop from '../ScrollToTop'
import GlobalSearch from '../GlobalSearch'
import Breadcrumbs from '../Breadcrumbs'
import SkipToContent from '../SkipToContent'
import ToastContainer from '../Toast'
import OnboardingTour from '../OnboardingTour'
import NowPlayingBar from '../NowPlayingBar'

const Layout = ({ children }) => {
  const { currentTrack } = useAudio()
  
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Background gradient overlay - mesmo da Home */}
      <div className="fixed inset-0 bg-gradient-to-br from-rjb-yellow/5 via-transparent to-rjb-yellow/10 dark:from-rjb-yellow/5 dark:via-transparent dark:to-rjb-yellow/5 pointer-events-none z-0"></div>
      
      <SkipToContent />
      
      <div className="relative z-10 flex flex-col min-h-screen">
        <Header />
        <main 
          id="main-content"
          className={`flex-grow pt-16 sm:pt-20 md:pt-20 opacity-100 transition-opacity duration-500 relative z-10 transition-all duration-300 ${
            currentTrack ? 'pb-20 sm:pb-24 md:pb-20' : 'pb-0'
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Breadcrumbs />
          </div>
          {children}
        </main>
        <Footer />
      </div>
      
      <LoadingOverlay />
      <MessageBox />
      <ToastContainer />
      <ScrollToTop />
      <GlobalSearch />
      <OnboardingTour />
      <NowPlayingBar />
    </div>
  )
}

export default Layout
